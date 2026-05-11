"""WebSocket handlers for game module."""

import asyncio
from typing import Any

from channels.db import database_sync_to_async
from django.db.models import Max, Sum
from music.serializers import BlindSerializer, TrackSerializer
from project.consumers import GlobalConsumer
from project.defaults import default_pts
from rest_framework import serializers
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from stats.serializers import LiveGameSerializer, LiveRoundSerializer
from thefuzz import fuzz
from userprofile.models import Profile

from game.models import Game
from game.serializers import GameUpdateSerializer
from game.services import apply_game_settings, format_validation_errors
from game.ws_game_loop import play_rounds_loop


async def handle_game_action(consumer: Any, content: dict) -> None:
	"""Route game events to appropriate handlers."""
	game_event = content.get('event')
	game_uid = content.get('game_uid')
	if game_event == 'join_game':
		consumer.current_game = await _get_game(consumer, game_uid, False)
		if not getattr(consumer, 'current_game', None):
			await consumer.send_json({'target': 'game',
									'event': 'error',
									'message': 'Game not found'})
			return
		await _join_game(consumer, content)
		return

	if getattr(consumer, 'current_game', None) is None:
		consumer.current_game = await _get_game(consumer, game_uid, True)
		if getattr(consumer, 'current_game', None) is None:
			await consumer.send_json({'target': 'game',
									'event': 'error',
									'message': 'Game not found for this player'})
			return

	match game_event:
		case 'start_game':
			await _start_game(consumer, content)
		case 'update_settings':
			await _update_game_settings(consumer, content)
		case 'submit_answer':
			await _submit_answer(consumer, content)
		# case 'reveal_track':
		# 	await _reveal_track(consumer, content)
		case 'leave_game':
			await _leave_game(consumer, content)
		case _:
			await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': f'Unknown game event: {game_event}'})


async def run_game_loop(consumer: GlobalConsumer, game: Game, group_name: str) -> None:
	"""Run the main game loop, cycling through rounds and sending updates."""
	consumer.all_answers_received = asyncio.Event()
	await _init_game_stats(game)
	for round in range(1, game.num_tracks + 1):
		consumer.all_answers_received.clear()
		await _init_round_stats(game, game.current_round)
		# Wait for all answers or timeout after playback duration
		# (with a small buffer of 0.2 second)
		await _send_track(consumer, game, game.current_round, group_name)
		await asyncio.wait_for(consumer.all_answers_received.wait(),
								timeout=game.playback_duration.total_seconds() + 0.2)
		await _compute_round_stats(game, game.current_round)
		await _send_round_stats(game, game.current_round, group_name)
		await _set_current_round(game, round)
		await asyncio.sleep(game.break_duration.total_seconds())
	await _compute_game_stats(game)
	await _send_game_stats(consumer, game, group_name)

@database_sync_to_async
def _init_game_stats(game: Game) -> None:
	"""Initialize game stats for all players at the start of a game."""
	for player in game.players.all():
		UserGameStats.objects.create(
			game=game,
			player=player,
			is_won=False
		)
	game.status = 'in_progress'
	game.save(update_fields=['status'])

@database_sync_to_async
def _set_current_round(game: Game, round_number: int) -> None:
	"""Set the current round number on the Game model."""
	game.current_round = round_number
	if 0 <= round_number - 1 < game.playlist.tracks.count():
		game.current_track = game.playlist.tracks.all()[round_number - 1]
	else:
		game.current_track = None
	game.save(update_fields=['current_round', 'current_track'])
	return

async def _send_track(consumer: GlobalConsumer,
					game: Game, round_number: int,
					group_name: str) -> None:
	"""Send the current track data to players at the start of a round."""
	track = game.current_track
	if not track:
		await consumer.group_send(group_name,)
		return
	serialized_track = BlindSerializer(track).data
	event = {'type': 'game_round_start',
			'game_uid': str(game.uid),
			'started_by': game.owned_by.username if game.owned_by else None,
			'round_number': round_number,
			'track': serialized_track,
			'playback_duration': game.playback_duration.total_seconds()}
	await consumer.group_send(group_name, event)

@database_sync_to_async
def _init_round_stats(game: Game, round_number: int) -> None:
	"""Initialize round stats for all players at the start of a round."""
	round = GameRoundStats.objects.create(
		game=game,
		round_number=round_number,
		track=game.current_track,
		player=game.players.all()
	)
	for player in game.players.all():
		UserRoundStats.objects.create(
			game=game,
			player=player,
			round=round,
		)

@database_sync_to_async
def _compute_round_stats(game: Game, round_number: int) -> None:
	"""Collect and store game statistics after a round finishes."""
	stats = UserRoundStats.objects.filter(round__round_number=round_number,
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
		return
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
		return
	elif game.game_mode == 'normal':
		for stat in stats:
			if stat.artist_found and stat.song_found:
				stat.xp_earned += default_pts['normal']['both']
			elif stat.artist_found or stat.song_found:
				stat.xp_earned += default_pts['normal']['partial']
			stat.save(update_fields=['xp_earned'])
		return

@database_sync_to_async
async def _send_round_stats(consumer: GlobalConsumer, game: Game, group_name: str) -> None:
	"""Send final game stats to players at the end of a game."""
	player_stats = UserRoundStats.objects.filter(game=game,
												round__round_number=game.current_round)
	serialized_stats = LiveRoundSerializer(player_stats, many=True).data
	event = {'type': 'game_round_end',
			'game_uid': str(game.uid),
			'started_by': game.owned_by.username if game.owned_by else None,
			'round_number': game.current_round,
			'track': TrackSerializer(game.current_track).data if game.current_track
															else None,
			'results': serialized_stats,
			'message': 'Round ended',
			'is_last_round': (game.current_round > game.num_tracks)}
	await consumer.group_send(group_name, event)

@database_sync_to_async
def _compute_game_stats(consumer: GlobalConsumer, game: Game, group_name: str) -> None:
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
async def _send_game_stats(consumer: GlobalConsumer,
							game: Game,
							group_name: str) -> None:
	"""Send final game stats to players at the end of a game."""
	global_stats = UserGameStats.objects.filter(game=game).select_related('player')
	serialized_stats = LiveGameSerializer(global_stats, many=True).data
	await consumer.group_send(
		group_name,
		{'type': 'game_game_completed',
		'game_uid': str(game.uid),
		'started_by': game.owned_by.username if game.owned_by else None,
		'leaderboard': serialized_stats
		})

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
							.prefetch_related('playlist', 'owned_by')
							.first())
	
	return (Game.objects.filter(uid=game_uid)
			.prefetch_related('playlist', 'owned_by')
			.first())


@database_sync_to_async
def _add_player_to_game(game: Game, profile: Profile) -> bool:
	"""Add a player to a game by creating UserGameStats entry."""
	try:
		UserGameStats.objects.get_or_create(game=game, player=profile)
		return True
	except Exception:
		return False

@database_sync_to_async
def _remove_player_from_game(game: Game, profile: Profile) -> bool:
	"""Remove a player from a game by deleting UserGameStats entry."""
	try:
		UserGameStats.objects.filter(game=game, player=profile).delete()
		return True
	except Exception:
		return False

async def _join_game(consumer: Any, content: dict) -> None:
	"""Join a game group."""
	group_name = f'game_{consumer.current_game.uid}'
	
	player_added = await _add_player_to_game(consumer.current_game, consumer.profile)
	if not player_added:
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'Failed to join game'})
		return
	
	await consumer.add_to_layer(group_name)
	
	await consumer.group_send(group_name, {
		'type': 'game.player_joined',
		'player_name': consumer.profile.username,
		'player_uid': str(consumer.profile.uid),
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'joined_game',
		'game_uid': str(consumer.current_game.uid),
	})

async def _start_game(consumer: Any, content: dict) -> None:
	"""Start a game session / Begin the round loop."""
	if not getattr(consumer, 'current_game', None):
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'No game context'})
		return
	game_uid = consumer.current_game.uid
	group_name = f'game_{game_uid}'

	# Broadcast: game started
	await consumer.group_send(group_name, {
		'type': 'game.game_started',
		'started_by': consumer.current_game.owned_by.username
			if consumer.current_game.owned_by else None,
		'game_uid': str(game_uid),
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'game_started',
		'game_uid': str(game_uid),
	})
	# START THE ROUND LOOP IN BACKGROUND so this client can keep receiving broadcasts
	# (awaiting the loop here blocks the same consumer from handling group events).
	if not hasattr(consumer, '_game_loop_tasks'):
		consumer._game_loop_tasks = {}
	if game_uid in consumer._game_loop_tasks and not consumer._game_loop_tasks[game_uid].done():
		return
	consumer._game_loop_tasks[game_uid] = asyncio.create_task(play_rounds_loop(consumer, game_uid))


async def _submit_answer(consumer: Any, content: dict) -> None:
	"""Submit an answer to current game question."""
	answer = content.get('answer')
	answer_time = content.get('answer_time')

	if answer is None or answer_time is None:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'answer and answer_time required'})
		return

	if not getattr(consumer, 'current_game', None):
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'No game context'})
		return

	game_uid = consumer.current_game.uid

	# Check if the player is in playback phase
	if not hasattr(consumer, 'current_round_state'):
		await consumer.send_json({
			'target': 'game',
			'event': 'error',
			'message': 'No active round'
		})
		return
	
	profile_uid = str(consumer.profile.uid)
	profile_name = consumer.profile.username
	track = await get_track_reveal_data(game_uid)

	is_correct = await validate_answer(consumer, consumer.profile, consumer.current_game, answer)
	await check_all_answers_received(consumer, consumer.current_game)
	consumer.current_round_state['answers'][profile_uid] = {
		'answer': answer,
		'time': answer_time,
		'is_correct': is_correct,
		'player_uid': profile_uid,
		'player_username': profile_name,
	}
	
	# Send response to THIS player only
	if is_correct:
		await consumer.send_json({
			'target': 'game',
			'event': 'answer_correct',
			'track': track,  # Already serialized from get_track_reveal_data
		})
	else:
		# Tell incorrect players their answer was wrong
		await consumer.send_json({
			'target': 'game',
			'event': 'answer_incorrect',
			'message': 'Wrong answer'
		})
	
	# Broadcast to ALL that someone answered (without the answer)
	await consumer.group_send(f'game_{game_uid}', {
		'type': 'game.player_answered',
		'player_name': profile_name,
		'player_uid': profile_uid,
	})

async def _update_game_settings(consumer: Any, content: dict) -> None:
	"""Apply game settings through the shared PATCH logic and broadcast the result."""
	if not getattr(consumer, 'current_game', None):
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'No game context'})
		return

	if consumer.current_game.status != 'waiting':
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'Game settings can only be changed before'
							'the game starts'})
		return

	game_uid = str(consumer.current_game.uid)
	group_name = f'game_{game_uid}'
	settings_payload = {key: value for key, value in content.items() if key not in
					{'target', 'event', 'game_uid'}}

	try:
		updated_game = await database_sync_to_async(apply_game_settings)(
			consumer.current_game,
			settings_payload,
			partial=True)
	except serializers.ValidationError as exc:
			await consumer.send_json({
				'target': 'game',
				'event': 'error',
				'error': format_validation_errors(exc)['error'],
			})
			return

	consumer.current_game = updated_game
	settings_data = GameUpdateSerializer(updated_game).data
	await consumer.group_send(group_name, {
		'type': 'game.game_settings_updated',
		'game_uid': game_uid,
		'settings': settings_data,
	})

		
async def _leave_game(consumer: Any, content: dict) -> None:
	"""Leave a game group."""
	if not getattr(consumer, 'current_game', None):
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'No game context'})
		return

	profile_uid = str(consumer.profile.uid)
	profile_name = consumer.profile.username
	game_uid = consumer.current_game.uid
	group_name = f'game_{game_uid}'
	
	# Remove player from game in database
	await _remove_player_from_game(consumer.current_game, consumer.profile)
	
	await consumer.remove_from_layer(group_name)
	consumer.current_game = None
	
	await consumer.group_send(group_name, {
		'type': 'game.player_left',
		'player_name': profile_name,
		'player_uid': profile_uid,
		'game_uid': str(game_uid),
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'left_game',
		'game_uid': str(game_uid),
	})


@database_sync_to_async
def get_track_reveal_data(game_uid: str) -> dict | None:
	"""Get full track data for revealing to players.
	
	Args:
		game_uid: UUID of the game
	
	Returns:
		dict with track details (title, artist, preview_url, artwork_url) or None
	"""
	try:
		game = Game.objects.get(uid=game_uid)
		if not game.current_track:
			return None
		track_data = TrackSerializer(game.current_track).data
		return track_data
	except Game.DoesNotExist:
		return None

@database_sync_to_async
def validate_answer(consumer: Any, player: Profile, game: Game, answer: str) -> bool:
	"""Validate answer against current track and return correctness.
	
	Args:
		consumer: The WebSocket consumer instance
		player: The player profile
		game: The game instance
		answer: Player's answer (song title or artist name)
	
	Returns:
		bool: Whether the answer is correct
	"""
	try:
		if not game.current_track:
			return False
		if player is None or player not in game.players.all():
			return False
		player_stats = UserRoundStats.objects.filter(round__game=game,
												round__round_number=game.current_round,
												player=player
												).first()
		if not player_stats:
			return False
		player_answer = answer.lower().strip()
		if not player_stats.artist_found:
			track_artist = game.current_track.artist.lower().strip()
			if ((fuzz.partial_ratio(player_answer, track_artist) >= 80 and game.fuzzy_match)
				or player_answer == track_artist):
				player_stats.artist_found = True
				player_stats.save(update_fields=['artist_found'])
				return True
		if not player_stats.title_found:
			track_title = game.current_track.title.lower().strip()
			if ((fuzz.partial_ratio(player_answer, track_title) >= 80 and game.fuzzy_match)
				or player_answer == track_title):
				player_stats.title_found = True
				player_stats.save(update_fields=['title_found'])
				return True
		return False
	except Game.DoesNotExist:
		return False

async def check_all_answers_received(consumer: Any, game: Game) -> None:
	"""Check if all players have submitted their answers for the current round."""
	player_stats = UserRoundStats.objects.filter(round__game=game,
												round__round_number=game.current_round,
												artist_found=True,
												song_found=True)
	if player_stats.count() == len(consumer.current_round_state['answers']):
		consumer.all_answers_received.set()
	