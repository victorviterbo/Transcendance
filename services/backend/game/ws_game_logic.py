"""WebSocket handlers for game module."""

import asyncio
from typing import Any

from channels.db import database_sync_to_async
from django.db.models import Max, Sum, Q, Count
from music.serializers import BlindSerializer, TrackSerializer
from project.consumers import GlobalConsumer
from project.defaults import default_pts, countdown_time, answer_buffer_time
from rest_framework import serializers
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from stats.serializers import LiveGameSerializer, LiveRoundSerializer
from thefuzz import fuzz
from userprofile.models import Profile
from game.models import Game
from game.serializers import GameUpdateSerializer, GameHeaderSerializer
from game.services import apply_game_settings, format_validation_errors
from music.models import Track
from userprofile.serializers import LightProfileSerializer

from .ws_game_db_helpers import (
	_get_game,
	_get_track_reveal_data,
	_set_current_round,
	_init_game_stats,
	_init_round_stats,
	_compute_round_stats,
	_validate_answer,
	_compute_game_stats,
	_get_round_stats_completeness,
	_get_round_stats,
	_get_game_stats,
	_add_player_to_game_stats,
	_remove_player_from_game_stats
)

from .ws_game_send_helpers import (
	_send_track,
	_send_round_stats,
	_send_game_stats
)

async def handle_game_action(consumer: Any, content: dict) -> None:
	"""Route game events to appropriate handlers."""
	game_event = content.get('event')
	game_uid = content.get('game_uid')

	if not consumer.profile:
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': f'Could not identify player'})
	
	if game_event == 'join_game':
		if getattr(consumer, 'current_game', None):
			await consumer.send_json({'target': 'game',
									'event': 'error',
									'message': 'Already in a game'})
			return
		consumer.current_game = await _get_game(consumer, game_uid, False)
		if not getattr(consumer, 'current_game', None):
			await consumer.send_json({'target': 'game',
									'event': 'error',
									'message': 'Game not found'})
			return
		consumer.group_name = f'game_{consumer.current_game.uid}'
		await _join_game(consumer, consumer.current_game, consumer.profile)
		return

	if getattr(consumer, 'current_game', None) is None:
		consumer.current_game = await _get_game(consumer, game_uid, True)
		if getattr(consumer, 'current_game', None) is None:
			await consumer.send_json({'target': 'game',
									'event': 'error',
									'message': 'Game not found for this player'})
			return
	
	consumer.group_name = f'game_{consumer.current_game.uid}'

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


async def run_game_loop(consumer: GlobalConsumer, content: dict) -> None:
	"""Run the main game loop, cycling through rounds and sending updates."""
	consumer.all_answers_received = asyncio.Event()
	await _init_game_stats(consumer.current_game)
	# for first iteration let some time for the count down to be seen by players
	buffer_time = countdown_time + answer_buffer_time
	await asyncio.sleep(buffer_time)
	for round in range(1, consumer.current_game.num_tracks + 1):
		consumer.all_answers_received.clear()
		await _init_round_stats(consumer.current_game, consumer.current_game.current_round)
		# Wait for all answers or timeout after playback duration
		# switch buffertime to just handle lag
		buffer_time = answer_buffer_time
		await _send_track(consumer)
		await asyncio.wait_for(consumer.all_answers_received.wait(),
								timeout=consumer.current_game.playback_duration.total_seconds() + buffer_time)
		await _compute_round_stats(consumer.current_game, consumer.current_game.current_round)
		round_stats = await _get_round_stats(consumer.current_game)
		await _send_round_stats(consumer)
		await _set_current_round(consumer.current_game, round)
		await asyncio.sleep(consumer.current_game.break_duration.total_seconds())
	await _compute_game_stats(consumer.current_game, consumer.group_name)
	game_stats = await _get_game_stats(consumer.game)
	await _send_game_stats(consumer, game_stats)


async def _start_game(consumer: Any, content: dict) -> None:
	"""Start a game session / Begin the round loop."""
	if not getattr(consumer, 'current_game', None):
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'No game context'})
		return
	# START THE ROUND LOOP IN BACKGROUND so this client can keep receiving broadcasts
	# (awaiting the loop here blocks the same consumer from handling group events).
	if not hasattr(consumer, '_game_loop_tasks'):
		consumer._game_loop_tasks = {}
	if (consumer.current_game.uid in consumer._game_loop_tasks and
	not consumer._game_loop_tasks[consumer.current_game.uid].done()):
		return
	consumer._game_loop_tasks[consumer.current_game.uid] = asyncio.create_task(
		run_game_loop(consumer, consumer.current_game, consumer.group_name)
		)

async def _join_game(consumer: GlobalConsumer, content: dict) -> None:
	"""Join a game."""

	player_added = await _add_player_to_game_stats(consumer.current_game, consumer.profile)
	if not player_added:
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'Failed to join game'})
		return
	
	await consumer.add_to_layer(consumer.group_name)
	serialized_game = GameHeaderSerializer(consumer.current_game).data
	serialized_player = LightProfileSerializer(player_added).data
	await consumer.group_send(consumer.group_name, {
		'type': 'game_player_joined',
		'game': serialized_game,
		'player': serialized_player
	})


async def _submit_answer(consumer: Any, content: dict) -> None:
	"""Submit an answer to current game question."""
	answer = content.get('answer')
	answer_time = content.get('answer_time')

	if answer is None or answer_time is None:
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'answer and answer_time required'})
		return
	
	if consumer.current_game.status != 'playing_round':
		await consumer.send_json({
			'target': 'game',
			'event': 'error',
			'message': 'No active round'
		})
		return
	
	track = await _get_track_reveal_data(consumer.current_game)

	artist_correct, song_correct = await _validate_answer(consumer,
									consumer.profile,
									consumer.current_game,
									answer,
									track)
	if any(artist_correct, song_correct) and consumer.current_game.mode == 'armagedon':
		await check_all_answers_received(consumer, consumer.current_game)
	
	# Send response to THIS player only
	serialized_game = GameHeaderSerializer(consumer.current_game).data
	serialized_player = LightProfileSerializer(consumer.profile).data
	if any(artist_correct, song_correct):
		if consumer.current_game.game_mode == 'armagedon':
			# if game_mode is armagedon, send the response to everyone
			await consumer.group_send(consumer.group_name, {
				'target': 'game',
				'event': 'answer_correct',
				'game': serialized_game,
				'senderPlayer': serialized_player,
				'trackArtist': track['artist'] if artist_correct else None,
				'trackSong': track['song'] if song_correct else None,
			})
		else:
			# else send only to player who send the correct response
			await consumer.send_json({
				'target': 'game',
				'event': 'answer_correct',
				'game': serialized_game,
				'track': track,
				'trackArtist': track['artist'] if artist_correct else None,
				'trackSong': track['song'] if song_correct else None,
			})
	else:
		# Tell incorrect players their answer was wrong
		if consumer.current_game.answer_public:
			await consumer.group_send(consumer.group_name, {
			'type': 'game_player_answered',
			'game': serialized_game,
			'senderPlayer': serialized_player,
			'answerString': answer
			})
		else:
			await consumer.send_json(consumer.group_name, {
				'type': 'game_player_answered',
				'game': serialized_game,
				'answerString': answer
				})

async def _update_game_settings(consumer: Any, content: dict) -> None:
	"""Apply game settings through the shared PATCH logic and broadcast the result."""
	serialized_game = GameHeaderSerializer(consumer.current_game).data
	
	if consumer.current_game.status != 'waiting':
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'Game settings can only be changed before'
							'the game starts'})
		return

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
	await consumer.group_send(consumer.group_name, {
		'type': 'game_game_settings_updated',
		'game': serialized_game,
		'settings': settings_data,
	})


async def _leave_game(consumer: Any, content: dict) -> None:
	"""Leave a game group."""
	if not getattr(consumer, 'current_game', None):
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'No game context'})
		return
	
	await _remove_player_from_game_stats(consumer.current_game, consumer.profile)
	
	await consumer.remove_from_layer(consumer.group_name)
	consumer.current_game = None
	serialized_game = GameHeaderSerializer(consumer.current_game).data
	serialized_player = LightProfileSerializer(consumer.profile).profile
	await consumer.group_send(consumer.group_name, {
		'type': 'game_player_left',
		'game': serialized_game,
		'player': serialized_player,
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'left_game',
		'game': serialized_game,
	})


async def check_all_answers_received(consumer: Any, game: Any) -> None:
    """
    Unlocks the game loop if either:
    1. Everyone has found both the title and artist.
    2. At least one title AND at least one artist have been found.
    """
    found = await _get_round_stats_completeness(game)
    game_over = found['titles'] > 0 and found['artists'] > 0

    if game_over:
        consumer.all_answers_received.set()
