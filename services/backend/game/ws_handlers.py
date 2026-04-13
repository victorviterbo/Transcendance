"""WebSocket handlers for game module."""

from typing import Any

from channels.db import database_sync_to_async
from game.models import Game


async def handle_game_action(consumer: Any, content: dict) -> None:
	"""Route game actions to appropriate handlers."""
	action = content.get('action')

	if action == 'join_room':
		await _join_game_room(consumer, content)
	elif action == 'start_game':
		await _start_game(consumer, content)
	elif action == 'submit_answer':
		await _submit_answer(consumer, content)
	elif action == 'reveal_track':
		await _reveal_track(consumer, content)
	elif action == 'leave_room':
		await _leave_game_room(consumer, content)
	else:
		await consumer.send_json({'type': 'error', 'message': f'Unknown game action: {action}'})


async def _join_game_room(consumer: Any, content: dict) -> None:
	"""Join a game room group."""
	room_id = content.get('room_id')
	if not room_id:
		await consumer.send_json({'type': 'error', 'message': 'room_id required'})
		return

	group_name = f'game_room_{room_id}'
	await consumer.add_to_layer(group_name)
	
	await consumer.group_send(group_name, {
		'type': 'game.player_joined',
		'player_name': consumer._sender_name(),
		'player_id': consumer.profile.id,
	})
	
	await consumer.send_json({
		'type': 'game_event',
		'event': 'joined_room',
		'room_id': room_id,
	})


async def _start_game(consumer: Any, content: dict) -> None:
	"""Start a game session."""
	room_id = content.get('room_id')
	if not room_id:
		await consumer.send_json({'type': 'error', 'message': 'room_id required'})
		return

	group_name = f'game_room_{room_id}'
	
	await consumer.group_send(group_name, {
		'type': 'game.game_started',
		'started_by': consumer._sender_name(),
		'room_id': room_id,
	})
	
	await consumer.send_json({
		'type': 'game_event',
		'event': 'game_started',
	})


async def _reveal_track(consumer: Any, content: dict) -> None:
	"""Reveal the track for the current round."""
	room_id = content.get('room_id')
	if not room_id:
		await consumer.send_json({'type': 'error', 'message': 'room_id required'})
		return

	group_name = f'game_room_{room_id}'
	
	# TODO: Fetch track from playlist and send preview
	track_data = {
		'track_id': 1,
		'preview_url': 'https://example.com/example.m4a',
		'artwork_url': 'https://example.com/art.jpg',
	}
	
	await consumer.group_send(group_name, {
		'type': 'game.track_revealed',
		'track': track_data,
		'room_id': room_id,
	})


async def _submit_answer(consumer: Any, content: dict) -> None:
	"""Submit an answer to current game question."""
	room_id = content.get('room_id')
	answer = content.get('answer')
	
	if not room_id or answer is None:
		await consumer.send_json({'type': 'error', 'message': 'room_id and answer required'})
		return

	group_name = f'game_room_{room_id}'
	
	# TODO: Implement answer validation logic here
	is_correct = validate_answer(answer)
	
	await consumer.group_send(group_name, {
		'type': 'game.answer_submitted',
		'player_name': consumer._sender_name(),
		'player_id': consumer.profile.id,
		'answer': answer,
		'is_correct': is_correct,
	})


async def _leave_game_room(consumer: Any, content: dict) -> None:
	"""Leave a game room group."""
	room_id = content.get('room_id')
	if not room_id:
		await consumer.send_json({'type': 'error', 'message': 'room_id required'})
		return

	group_name = f'game_room_{room_id}'
	await consumer.remove_from_layer(group_name)
	
	await consumer.group_send(group_name, {
		'type': 'game.player_left',
		'player_name': consumer._sender_name(),
		'player_id': consumer.profile.id,
		'room_id': room_id,
	})
	
	await consumer.send_json({
		'type': 'game_event',
		'event': 'left_room',
		'room_id': room_id,
	})


def validate_answer(answer: str) -> bool:
	"""Validate an answer (placeholder).
	
	TODO: Implement actual answer validation logic
	against the current track.
	"""
	# Placeholder validation
	return answer.lower() in ['correct', 'true', '1']
