"""Handle all DB hits for the game."""

import random
import uuid
from typing import TYPE_CHECKING, Any

from channels.db import database_sync_to_async
from chat.models import Room
from django.db.models import Count, Q, Sum
from music.models import Playlist, Track
from music.serializers import TrackSerializer
from project.defaults import default_pts
from rest_framework import serializers
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from stats.serializers import LiveGameSerializer, LiveRoundSerializer
from thefuzz import fuzz
from userprofile.models import Profile
from userprofile.serializers import LightProfileSerializer

from game.models import Game
from game.serializers import GameHeaderSerializer, GameUpdateSerializer

if TYPE_CHECKING:
    from project.consumers import GlobalConsumer

@database_sync_to_async
def _get_game(consumer: Any,
			game_uid: str | None,
			req_membership: bool = True) -> Game | None:
	"""Fetch a Game instance by uid, and check for player's membership if requested."""
	if not game_uid:
		return None
	if req_membership:
		return (Game.objects.filter(uid=game_uid,
							players=consumer.profile)
							.select_related('playlist',
										'owned_by')
							.prefetch_related('playlist__tracks')
							.first())
	
	return (Game.objects.filter(uid=game_uid)
			.select_related('playlist', 'owned_by')
			.prefetch_related('playlist__tracks')
			.first())


@database_sync_to_async
def _setup_game_assets(game: Game) -> None:
	"""Create the playlist, room, and current track for a validated game."""
	if not game.genres:
		return #TODO handle errors here

	tracks_per_genre = game.num_tracks // len(game.genres)
	all_tracks = list()
	for genre in game.genres:
		genre_tracks = list(
			Track.objects.filter(genre__iexact=genre).order_by('?')[:tracks_per_genre]
		)
		if len(genre_tracks) < tracks_per_genre:
			raise serializers.ValidationError(
				'Not enough tracks for genre: ' + genre,
				code='NOT_ENOUGH_TRACKS_GENRE',
			)
		all_tracks.extend(genre_tracks)
	if not len(all_tracks) == game.num_tracks:
		raise serializers.ValidationError(
			'Error in playlist creation process',
			code='NO_TRACKS_FOUND',
		)
	if not all_tracks:
		raise serializers.ValidationError(
			'No tracks available for the selected genres',
			code='NO_TRACKS_FOUND',
		)

	random.shuffle(all_tracks)
	playlist_uid = uuid.uuid4()
	playlist = Playlist.objects.create(
		name=f'Playlist - {game.uid}',
		uid=playlist_uid,
	)
	playlist.tracks.set(all_tracks)

	room_uid = uuid.uuid4()
	room = Room.objects.create(
		name=f"Chat Room - {game.uid}",
		is_direct=False,
		uid=room_uid,
	)
	game.playlist = playlist
	game.current_track = all_tracks[0]
	game.room = room
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
def _get_track_reveal_data(consumer: 'GlobalConsumer', content: dict) -> dict | None:
	"""Get full track data for revealing to players.
	
	Args:
		game: current game being played
	
	Returns:
		dict with track details (title, artist, preview_url, artwork_url) or None
	"""
	try:
		if not consumer.current_game.current_track:
			return None, None
		track_data = TrackSerializer(consumer.current_game.current_track).data
		track_data_hidden = {'preview_url': track_data['preview_url']}
		return track_data, track_data_hidden
	except Game.DoesNotExist:
		return None, None

@database_sync_to_async
def _validate_answer(consumer: Any, content: dict, track: dict) -> tuple[bool, bool]:
	"""Validate answer against current track and return correctness.
	
	Args:
		consumer: The WebSocket consumer instance
		player: The player profile
		game: The game instance
		answer: Player's answer (song title or artist name)
		track: The current track instance
	
	Returns:
		bool: Whether the artist is correct
		bool: Whether the song is correct
	"""
	try:
		time = content.get('answer_time')
		player_answer = content.get('answer').lower().strip()
		if track is None or time is None or player_answer is None:
			return False, False
		if (consumer.profile is None or
				consumer.profile not in consumer.current_game.players.all()):
			return False, False
		player_stats = UserRoundStats.objects.filter(round__game=consumer.current_game,
													round__round_number=consumer.current_game.current_round,
													player=consumer.profile
													).first()
		if not player_stats:
			return False, False
		if not player_stats.artist_found:
			track_artist = track['artist'].lower().strip()
			if ((fuzz.partial_ratio(player_answer, track_artist) >= 80
		and consumer.current_game.fuzzy_match)
				or player_answer == track_artist):
				player_stats.artist_found = True
				player_stats.artist_found_at = time
				player_stats.save(update_fields=['artist_found'])
				return True, False
		if not player_stats.song_found:
			track_title = track['title'].lower().strip()
			if ((fuzz.partial_ratio(player_answer, track_title) >= 80
		and consumer.current_game.fuzzy_match)
				or player_answer == track_title):
				player_stats.song_found = True
				player_stats.song_found_at = time
				player_stats.save(update_fields=['song_found'])
				return False, True
		return False, False
	except Game.DoesNotExist:
		return False, False


@database_sync_to_async
def _init_round_stats(game: Game) -> None:
	"""Initialize round stats for all players at the start of a round."""
	game_round_stats = GameRoundStats.objects.create(
		game=game,
		round_number=game.current_round,
		track=game.current_track,
	)
	#game_round_stats.players.set(game.players.all())
	for player in game.players.all():
		game_stats = UserGameStats.objects.filter(game=game, player=player).first()
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
	if game.game_mode == 'armagedon':
		first_artist = stats.filter(artist_found=True).order_by('artist_found_at').first()
		first_song = stats.filter(song_found=True).order_by('song_found_at').first()
		if first_artist and first_song and first_artist.player == first_song.player:
			first_artist.xp_earned += default_pts['armagedon']['both']
			first_artist.save(update_fields=['xp_earned'])
		else:
			if first_artist:
				first_artist.xp_earned += default_pts['armagedon']['artist']
				first_artist.save(update_fields=['xp_earned'])
			if first_song:
				first_song.xp_earned += default_pts['armagedon']['song']
				first_song.save(update_fields=['xp_earned'])
	elif game.game_mode == 'speed':
		xp_to_add = {}
		artist_pts = default_pts['speed']['artist']
		for stat in stats.filter(artist_found=True).order_by('artist_found_at'):
			bonus = max(artist_pts, 2)
			xp_to_add[stat.pk] = bonus
			artist_pts -= 1
		song_pts = default_pts['speed']['song']
		for stat in stats.filter(song_found=True).order_by('song_found_at'):
			bonus = max(song_pts, 2)
			xp_to_add[stat.pk] = xp_to_add.get(stat.pk, 0) + bonus
			song_pts -= 1
		for stat in stats:
			if stat.pk in xp_to_add:
				stat.xp_earned += xp_to_add[stat.pk]
				stat.save(update_fields=['xp_earned'])
	elif game.game_mode == 'normal':
		for stat in stats:
			if stat.artist_found and stat.song_found:
				stat.xp_earned += default_pts['normal']['both']
			elif stat.artist_found or stat.song_found:
				stat.xp_earned += default_pts['normal']['partial']
			stat.save(update_fields=['xp_earned'])
	game.status = 'playing_break'
	game.save(update_fields=['status'])
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
def _get_round_stats_completeness(game: Game) -> dict:
    """Performs a single database query to count artist_fount and song_found."""
    return UserRoundStats.objects.filter(
        round__game=game,
        round__round_number=game.current_round
    ).aggregate(
        titles=Count('id', filter=Q(song_found=True)),
        artists=Count('id', filter=Q(artist_found=True))
    )


@database_sync_to_async
def _add_player_to_game_stats(game: Game, player: Profile) -> bool:
	"""Add a player to a game by creating UserGameStats entry."""
	try:
		UserGameStats.objects.create(game=game,
									player=player)
		game.players.add(player)
		return True
	except Exception as e:
		print(e) #TODO handle gracefully
		return False


@database_sync_to_async
def _remove_player_from_game_stats(consumer: 'GlobalConsumer', content: dict) -> bool:
	"""Remove a player from a game by deleting UserGameStats entry."""
	try:
		UserGameStats.objects.filter(game=consumer.current_game,
									player=consumer.profile).delete()
		consumer.current_game.player.remove(consumer.profile)
		return True
	except Exception:
		return False

@database_sync_to_async
def _apply_game_settings(game: Game,
						data: dict[str, Any],
						*,
						partial: bool = True) -> Game:
	"""Validate and persist game settings updates through the shared serializer."""
	serializer = GameUpdateSerializer(instance=game, data=data, partial=partial)
	serializer.is_valid(raise_exception=True)
	return serializer.save()

@database_sync_to_async
def _get_num_curr_players(game: Game) -> int:
	"""Retrieve current number of players."""
	return len(game.players.all())

@database_sync_to_async
def _get_game_data(consumer: 'GlobalConsumer') -> dict:
	"""Retrieve game data for header."""
	return GameHeaderSerializer(consumer.current_game).data

@database_sync_to_async
def _get_game_settings_data(consumer: 'GlobalConsumer') -> dict:
	"""Retrieve game setting data."""
	return GameUpdateSerializer(consumer.current_game).data

@database_sync_to_async
def _get_player_data(consumer: 'GlobalConsumer') -> dict:
	"""Retrieve player data."""
	return LightProfileSerializer(consumer.profile).data

@database_sync_to_async
def _check_game_membership(game: Game, player: Profile) -> bool:
	"""Check if player is in a game."""
	return Game.objects.filter(uid=game.uid, players__id=player.id).exists()
