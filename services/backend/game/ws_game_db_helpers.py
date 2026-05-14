"""Handle all DB hits for the game."""

from typing import Any

from channels.db import database_sync_to_async
from django.db.models import Count, Max, Q, Sum
from music.models import Track
from music.serializers import TrackSerializer
from project.consumers import GlobalConsumer
from project.defaults import default_pts
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from stats.serializers import LiveGameSerializer, LiveRoundSerializer
from thefuzz import fuzz

from game.models import Game


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
def _set_current_round(game: Game, round_number: int) -> None:
	"""Set the current round number on the Game model."""
	game.current_round = round_number
	if 0 <= round_number - 1 < game.num_tracks:
		game.current_track = game.playlist.tracks.all()[round_number - 1]
	else:
		game.current_track = None
	game.save(update_fields=['current_round', 'current_track'])
	return


@database_sync_to_async
def _get_track_reveal_data(game: Game) -> dict | None:
	"""Get full track data for revealing to players.
	
	Args:
		game: current game being played
	
	Returns:
		dict with track details (title, artist, preview_url, artwork_url) or None
	"""
	try:
		if not game.current_track:
			return None
		track_data = TrackSerializer(game.current_track).data
		return track_data
	except Game.DoesNotExist:
		return None

@database_sync_to_async
def _validate_answer(consumer: Any, content: dict, track: Track) -> tuple[bool, bool]:
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
		time = content.get('timedelta')
		player_answer = content.get('answer').lower().strip()
		if not track or not time or not player_answer:
			return False, False
		if consumer.profile is None or consumer.profile not in consumer.current_game.players.all():
			return False, False
		player_stats = UserRoundStats.objects.filter(round__game=consumer.current_game,
													round__round_number=consumer.current_game.current_round,
													player=consumer.profile
													).first()
		if not player_stats:
			return False, False
		if not player_stats.artist_found:
			track_artist = track.artist.lower().strip()
			if ((fuzz.partial_ratio(player_answer, track_artist) >= 80
		and consumer.current_game.fuzzy_match)
				or player_answer == track_artist):
				player_stats.artist_found = True
				player_stats.artist_found_at = time
				player_stats.save(update_fields=['artist_found'])
				return True, False
		if not player_stats.song_found:
			track_title = track.title.lower().strip()
			if ((fuzz.partial_ratio(player_answer, track_title) >= 80
		and consumer.current_game.fuzzy_match)
				or player_answer == track_title):
				player_stats.song_found = True
				player_stats.song_found_at = time
				player_stats.save(update_fields=['song_found'])
				return False, True
		return False
	except Game.DoesNotExist:
		return False

@database_sync_to_async
def _init_game_stats(game: Game) -> None:
	"""Initialize game stats for all players at the start of a game."""
	for player in game.players.all():
		UserGameStats.objects.create(
			game=game,
			player=player,
			is_won=False,
		)
	game.status = 'playing_round'
	game.save(update_fields=['status'])


@database_sync_to_async
def _init_round_stats(game: Game) -> None:
	"""Initialize round stats for all players at the start of a round."""
	GameRoundStats.objects.create(
		game=game,
		round_number=game.current_round,
		track=game.current_track,
		player=game.players.all()
	)

	for player in game.players.all():
		UserRoundStats.objects.create(
			game=game,
			player=player,
			round=game.current_round,
		)

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


@database_sync_to_async
def _compute_game_stats(game: Game, group_name: str) -> None:
	"""Wrap up game stats for all players at the end of a game."""
	player_scores = (
		UserRoundStats.objects.filter(round__game=game)
		.values('player')
		.annotate(
			total_points=Sum('xp_earned'),
			total_time=Sum('time'))
		.order_by()
	)
	highest_score = player_scores.aggregate(max_score=Max('total_points'))['max_score']
	candidates = list(player_scores.filter(total_points=highest_score))
	if not candidates:
		return
	if len(candidates) == 1:
		winner_id = candidates[0]['player']
	else:
		winner_id = min(candidates, key=lambda x: x['total_time'])['player']
	UserGameStats.objects.filter(game=game, player_id=winner_id).update(is_won=True)
	for player, xp in player_scores.items():
		UserGameStats.objects.filter(game=game, player=player).update(
			total_xp_earned=xp
		)
	game.status = 'finished'
	game.save(update_fields=['status'])


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
def _get_round_stats(game: Game) -> dict:
	stats = UserRoundStats.objects.filter(game=game,
								round__round_number=game.current_round).all()
	return LiveRoundSerializer(stats, many=True).data
	

@database_sync_to_async
def _get_game_stats(game: Game) -> dict:
	stats = UserGameStats.objects.filter(game=game).select_related('player').all()
	return LiveGameSerializer(stats, many=True).data


@database_sync_to_async
def _add_player_to_game_stats(consumer: GlobalConsumer, content: dict) -> bool:
	"""Add a player to a game by creating UserGameStats entry."""
	try:
		UserGameStats.objects.get_or_create(game=consumer.current_game,
											player=consumer.profile)
		consumer.current_game.player.add(consumer.profile)
		return True
	except Exception:
		return False


@database_sync_to_async
def _remove_player_from_game_stats(consumer: GlobalConsumer, content: dict) -> bool:
	"""Remove a player from a game by deleting UserGameStats entry."""
	try:
		UserGameStats.objects.filter(game=consumer.current_game,
									player=consumer.profile).delete()
		consumer.current_game.player.remove(consumer.profile)
		return True
	except Exception:
		return False
	
