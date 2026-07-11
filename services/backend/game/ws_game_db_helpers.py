"""Handle all DB hits for the game."""
import json
import re
import uuid
from typing import TYPE_CHECKING, Any

from channels.db import database_sync_to_async
from chat.models import Room
from django.db.models import Count, Q, Sum
from music.models import Playlist, Track
from music.serializers import TrackSerializer
from project.defaults import default_pts, get_badge
from rest_framework import serializers
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from stats.serializers import (
    GameHistorySerializer,
    GameLeaderboardSerializer,
    LiveGameSerializer,
    LiveRoundSerializer,
)
from thefuzz import fuzz
from userprofile.models import Profile
from userprofile.serializers import LightProfileSerializer

from game.models import Game
from game.serializers import GameHeaderSerializer, GameSettingsSerializer
from game.ws_game_shared import ACTIVE_GAMES

if TYPE_CHECKING:
    from project.consumers import GlobalConsumer

@database_sync_to_async
def _get_game(consumer: Any,
            game_uid: str | None,
            req_membership: bool = True) -> Game | None:
    """Fetch a Game instance by uid, and check for player's membership if requested."""
    if not game_uid:
        return None
    try:
        uuid.UUID(str(game_uid))
    except ValueError:
        return None
    if req_membership:
        return (Game.objects.filter(uid=game_uid,
                            players=consumer.profile)
                            .select_related('playlist', 'owned_by')
                            .prefetch_related('playlist__tracks', 'room')
                            .first())
    return (Game.objects.filter(uid=game_uid)
            .select_related('playlist', 'owned_by')
            .prefetch_related('playlist__tracks')
            .first())


@database_sync_to_async
def _setup_game_assets(game: Game) -> None:
    """Create the playlist, room, and current track for a validated game."""
    if not game.genres:
        raise serializers.ValidationError(
                'No genre found',
                code='MISSING_FIELD_GENRE',
            )

    all_tracks = list(
        Track.objects.filter(genre__in=game.genres).order_by('?')[:game.trackCount]
    )
    if len(all_tracks) < game.trackCount:
        raise serializers.ValidationError(
            f'Only {len(all_tracks)} tracks found, need {game.trackCount}',
            code='NOT_ENOUGH_TRACKS',
        )
    if not all_tracks:
        raise serializers.ValidationError(
            'No tracks available for the selected genres',
            code='NO_TRACKS_FOUND',
        )
    playlist_uid = uuid.uuid4()
    playlist = Playlist.objects.create(
        name=f'Playlist - {game.uid}',
        uid=playlist_uid,
    )
    playlist.tracks.set(all_tracks)

    if getattr(game, 'room', None):# reuse existing room if already created at HTTP creation
        room = game.room
    else:
        room_uid = uuid.uuid4()
        room, _created = Room.objects.get_or_create(
            name=f"Chat Room - {game.uid}",
            defaults={'is_direct': False, 'uid': room_uid},
        )
    game.playlist = playlist
    game.room = room
    game.current_track = all_tracks[0]
    game.status = 'playing_round'
    game.save(update_fields=['playlist', 'current_track', 'room', 'status'])

@database_sync_to_async
def _set_current_round(game: Game, round_number: int) -> None:
    """Set the current round number on the Game model."""
    game.current_round = round_number
    idx = round_number - 1
    if 0 <= idx < len(game.playlist.tracks.all()):
        game.current_track = game.playlist.tracks.all()[idx]
    else:
        game.current_track = None
    game.save(update_fields=['current_round', 'current_track'])
    return


@database_sync_to_async
def _get_track_reveal_data(consumer: 'GlobalConsumer' | None = None, game: Game | None = None) -> dict | None:
    """Get full track data for revealing to players.
    
    Args:
        game: current game being played
    
    Returns:
        dict with track details (title, artist, preview_url, artwork_url) or None
    """
    if game is None:
        game = consumer.current_game
    try:
        if not game.current_track:
            return None, None
        serialized_track = TrackSerializer(game.current_track).data
        """track_data = {
            'title': serialized_track['title'],
            'artist': serialized_track['artist'],
            'preview': serialized_track['preview_url'],
            'artwork': serialized_track['artwork_url'],
        }"""
        serialized_track_hidden = {'preview': serialized_track['preview']}
        return serialized_track, serialized_track_hidden
    except Game.DoesNotExist:
        return None, None

@database_sync_to_async
def _validate_answer(consumer: Any, content: dict, track: dict) -> tuple[bool, bool, bool, bool]:
    """Validate answer against current track and return correctness.
    
    Args:
        consumer: The WebSocket consumer instance
        content: dict sent by client
        track: The current track instance
    
    Returns:
        bool: Whether the artist is found after this answer
        bool: Whether the title is found after this answer
        bool: Whether this answer newly found the artist
        bool: Whether this answer newly found the title
    """
    try:
        time = content.get('time')
        player_answer = content.get('answer').lower().strip()
        if track is None or time is None or player_answer is None:
            return False, False, False, False
        if (consumer.profile is None or
                consumer.profile not in consumer.current_game.players.all()):
            return False, False, False, False
        player_stats = UserRoundStats.objects.filter(round__game=consumer.current_game,
                                                    round__round_number=consumer.current_game.current_round,
                                                    player=consumer.profile
                                                    ).first()
        if not player_stats:
            return False, False, False, False
        artist_correct = player_stats.artist_found
        title_correct = player_stats.title_found
        artist_newly_found = False
        title_newly_found = False
        update_fields = []
        feat_pattern = r'[\s\-]+[\(\[][^\]\)]+[\)\]]$'
        if not player_stats.artist_found:
            track_artist = track['artist'].lower().strip()
            clean_track_artist = re.sub(feat_pattern, '', track_artist).strip()
            if ((fuzz.ratio(player_answer, clean_track_artist) >= 80
        and consumer.current_game.fuzzy)
                or player_answer == track_artist):
                player_stats.artist_found = True
                player_stats.artist_found_at = time
                artist_correct = True
                artist_newly_found = True
                update_fields.extend(['artist_found', 'artist_found_at'])
        if not player_stats.title_found:
            track_title = track['title'].lower().strip()
            clean_track_title = re.sub(feat_pattern, '', track_title).strip()
            if ((fuzz.ratio(player_answer, clean_track_title) >= 80
        and consumer.current_game.fuzzy)
                or player_answer == track_title):
                player_stats.title_found = True
                player_stats.title_found_at = time
                title_correct = True
                title_newly_found = True
                update_fields.extend(['title_found', 'title_found_at'])
        if update_fields:
            player_stats.save()
        return artist_correct, title_correct, artist_newly_found, title_newly_found
    except Game.DoesNotExist:
        return False, False, False, False


@database_sync_to_async
def _init_round_stats(game: Game) -> None:
    """Initialize round stats for all players at the start of a round."""
    game_round_stats = GameRoundStats.objects.create(
        game=game,
        round_number=game.current_round,
        track=game.current_track,
    )
    for player in game.players.all():
        game_stats = (UserGameStats.objects.filter(game=game,
                                                  player=player)
                                                  .first()
        )
        UserRoundStats.objects.create(
            player=player,
            round=game_round_stats,
            game_stats=game_stats
        )
    game.status = 'playing_round'
    game.save(update_fields=['status'])
    return

@database_sync_to_async
def _compute_round_stats(game: Game) -> None:
    """Collect and store game statistics after a round finishes."""
    stats = UserRoundStats.objects.filter(round__round_number=game.current_round,
                                        round__game=game)
    if game.mode == 'speed':
        xp_to_add = {}
        artist_pts = default_pts['speed']['artist']
        for stat in stats.filter(artist_found=True).order_by('artist_found_at'):
            bonus = max(artist_pts, 2)
            xp_to_add[stat.pk] = bonus
            artist_pts -= 1
        title_pts = default_pts['speed']['title']
        for stat in stats.filter(title_found=True).order_by('title_found_at'):
            bonus = max(title_pts, 2)
            xp_to_add[stat.pk] = xp_to_add.get(stat.pk, 0) + bonus
            title_pts -= 1
        for stat in stats:
            if stat.pk in xp_to_add:
                stat.xp_earned += xp_to_add[stat.pk]
                stat.save(update_fields=['xp_earned'])
    elif game.mode == 'normal':
        for stat in stats:
            if stat.artist_found and stat.title_found:
                stat.xp_earned += default_pts['normal']['both']
            elif stat.artist_found or stat.title_found:
                stat.xp_earned += default_pts['normal']['partial']
            stat.save(update_fields=['xp_earned'])
    game.status = 'playing_break'
    game.save(update_fields=['status'])
    stats = list(stats.order_by('-xp_earned', 'time', 'player__username'))
    for rank, stat in enumerate(stats, 1):
        stat.ranking = rank
    UserRoundStats.objects.bulk_update(stats, ['ranking'])
    return LiveRoundSerializer(stats, many=True).data


@database_sync_to_async
def _compute_game_stats(game: Game) -> dict:
    """Wrap up game stats for all players at the end of a game."""
    player_scores = (
        UserRoundStats.objects.filter(round__game=game)
            .values('player')
            .annotate(
                total_points=Sum('xp_earned'),
                total_time=Sum('time')
            )
            .order_by('-total_points', 'total_time')
    )
    for p in player_scores:
        p.update(active=False)
    # Persist each player's earned game XP directly on profile at game end.
    xp_by_player = {
        entry['player']: entry['total_points'] or 0
        for entry in player_scores
    }
    if xp_by_player:
        profiles_to_update = list(Profile.objects.filter(id__in=xp_by_player.keys()))
        for profile in profiles_to_update:
            xp_gain = xp_by_player.get(profile.id, 0)
            if xp_gain > 0:
                profile.exp_points += xp_gain
        if profiles_to_update:
            Profile.objects.bulk_update(profiles_to_update, ['exp_points'])
    winner_stats = player_scores.first()
    if winner_stats:
        UserGameStats.objects.filter(
            game=game,
            player_id=winner_stats['player']
        ).update(is_won=True)
    game.status = 'finished'
    game.save(update_fields=['status'])
    stats = UserGameStats.objects.filter(game=game).select_related('player').all()
    return LiveGameSerializer(stats, many=True).data

@database_sync_to_async
def _add_player_to_game_stats(game: Game, player: Profile) -> bool:
    """Add a player to a game by creating UserGameStats entry."""
    try:
        UserGameStats.objects.create(game=game, player=player, is_active=True)
        return True
    except Exception:
        raise


@database_sync_to_async
def _remove_player_from_game_stats(game: Game, player: Profile) -> tuple[bool, bool]:
    """Remove a player from a game by deleting UserGameStats entry."""
    try:
        UserGameStats.objects.filter(game=game, player=player).update(is_active=False)
        if not UserGameStats.objects.filter(game=game, is_active=True).exists():
            task_to_cancel = ACTIVE_GAMES[game.uid]['task']
            task_to_cancel.cancel()
            return False, False
        elif game.owned_by.id == player.id:
            game.owned_by = UserGameStats.objects.filter(game=game, is_active=True).first().player
            game.save(update_fields=['owned_by'])
            return True, True
        return False, True
    except Exception:
        return False, True

@database_sync_to_async
def _apply_game_settings(game: Game,
                        data: dict[str, Any],
                        *,
                        partial: bool = True) -> Game:
    """Validate and persist game settings updates through the shared serializer."""
    serializer = GameSettingsSerializer(instance=game, data=data, partial=partial)
    serializer.is_valid(raise_exception=True)
    return serializer.save()

@database_sync_to_async
def _get_num_curr_players(game: Game) -> int:
    """Retrieve current number of players."""
    return len(game.players.all())

@database_sync_to_async
def _get_game_data(consumer: 'GlobalConsumer' | None = None, game: Game | None = None) -> dict:
    """Retrieve game data for header."""
    if game is None:
        game = consumer.current_game
    return GameHeaderSerializer(game).data

@database_sync_to_async
def _get_game_settings_data(consumer: 'GlobalConsumer' | None = None, game: Game | None = None) -> dict:
    """Retrieve game setting data."""
    if game is None:
        game = consumer.current_game
    return GameSettingsSerializer(game).data

@database_sync_to_async
def _get_player_data(consumer: 'GlobalConsumer') -> dict:
    """Retrieve player data."""
    return LightProfileSerializer(consumer.profile).data

@database_sync_to_async
def _get_specific_player_data(profile: Profile) -> dict:
    """Retrieve player data."""
    return LightProfileSerializer(profile).data

def _build_base_game_payload(consumer: 'GlobalConsumer' | None = None, game: Game | None = None, current_player: Profile | None = None) -> dict:
    """Helper to build the shared payload data (leaderboard, history, self, uid)."""
    if game is None:
        game = consumer.current_game
    if current_player is None:
        current_player = consumer.profile

    leaderboard_rows = (
        UserGameStats.objects.filter(game=game, is_active=True)
        .select_related('player')
        .annotate(total_points=Sum('round_stats__xp_earned'))
        .order_by('-total_points', 'player__username')
    )
    round_rows = (
        UserRoundStats.objects.filter(round__game=game, player=current_player,
                        round__round_number__lt=game.current_round)
        .select_related('round__track')
        .order_by('round__round_number')
    )

    leaderboard = GameLeaderboardSerializer(leaderboard_rows, many=True).data
    history = GameHistorySerializer(round_rows, many=True).data

    payload = {
        'uid': str(game.uid),
        'self': LightProfileSerializer(current_player).data,
        'leaderboard': leaderboard,
        'history': history,
    }
    return payload


@database_sync_to_async
def _get_game_info_data(consumer: 'GlobalConsumer' | None = None, game: Game | None = None) -> dict:
    """Build the game_info payload for a joining player."""
    payload = _build_base_game_payload(consumer, game, consumer.profile if consumer else None)

    if game is None:
        game = consumer.current_game
    payload['game'] = GameHeaderSerializer(game).data
    payload['settings'] = GameSettingsSerializer(game).data
    
    return payload


@database_sync_to_async
def _get_game_ended_data(consumer: 'GlobalConsumer' | None = None, game: Game | None = None) -> dict:
    """Build the game_ended payload for all players."""
    return _build_base_game_payload(consumer, game, consumer.profile if consumer else None)

@database_sync_to_async
def _get_game_history_data(game_uid: str, player: Profile) -> list[dict]:
    """Build the per-player game history payload."""
    round_rows = (
        UserRoundStats.objects.filter(round__game__uid=game_uid, player=player)
        .select_related('round__track')
        .order_by('round__round_number')
    )
    return GameHistorySerializer(round_rows, many=True).data

@database_sync_to_async
def _check_game_membership(game: Game, player: Profile) -> bool:
    """Check if player is in a game."""
    return UserGameStats.objects.filter(game=game, player=player).exists()


@database_sync_to_async
def _get_active_game_for_player(player: Profile) -> Game | None:
    """Return the game a player is currently attached to, if any (excluding finished games)."""
    stats = (
        UserGameStats.objects
        .filter(player=player, game__status__in=['waiting', 'playing_round', 'playing_break'])
        .select_related('game')
        .first()
    )
    return stats.game if stats else None

def _delete_aborted_game(game: Game) -> None:
    """Delete a game that was aborted (no players left)."""
    game.delete()
    return
