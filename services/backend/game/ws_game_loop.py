"""Game loop orchestration and round execution logic."""

import asyncio
import time
from typing import Any

from channels.db import database_sync_to_async
from django.db.models import F
from django.utils import timezone
from music.serializers import TrackSerializer
from stats.models import UserGameStats, UserRoundStats

from game.models import Game


def _log(message: str) -> None:
	print(message, flush=False)


async def play_rounds_loop(consumer: Any, game_id: str) -> None:
	"""Main game loop that cycles through all rounds."""
	_log(f'game_loop.start game_id={game_id}')
	# Mark game as playing and record start time
	await set_game_status(game_id, 'playing')
	max_rounds = await get_max_rounds(game_id)
	group_name = f'game_{game_id}'

	# Fetch playlist tracks and iterate through songs rather than numeric rounds
	playlist_tracks = await get_playlist_tracks(game_id)
	_log(f'game_loop.playlist_fetched game_id={game_id} track_count={len(playlist_tracks)}')
	# Limit by max_rounds
	tracks_to_play = playlist_tracks[:max_rounds] if max_rounds else playlist_tracks
	_log(f'game_loop.tracks_to_play game_id={game_id} max_rounds={max_rounds} playing_count={len(tracks_to_play)}')

	for idx, track in enumerate(tracks_to_play, start=1):
		_log(f"game_loop.round_start game_id={game_id} round={idx} track_id={track.get('itunes_id')}")
		# Optionally set the current_track on the Game model for visibility
		await set_current_track(game_id, track.get('itunes_id'))
		# Play this round with the specific track
		await play_single_round(consumer, game_id, group_name, idx, track=track)
		_log(f'game_loop.round_end game_id={game_id} round={idx}')

	_log(f'game_loop.finished game_id={game_id}')
	# Game finished
	# await finalize_game(consumer, game_id, group_name)


async def play_single_round(consumer: Any, game_id: str, group_name: str,
							round_num: int, track: dict | None = None) -> None:
	"""Execute one round: playback → answer collection → reveal → breaktime.

	If `track` is provided we use that serialized track; otherwise fall back
	to the DB-backed `get_current_track` helper.
	"""  # noqa: D206
	# Local state for this round
	answers_received = {}  # {player_id: {'answer': str, 'time': float, 'is_correct': bool, 'player_id': int, 'player_username': str}}
	if track is None:
		track = await get_current_track(game_id)
	playback_duration = await get_playback_duration(game_id)
	
	# STEP 1: Start round with blind track info
	_log(f'game_loop.broadcast_round_started game_id={game_id} round={round_num}')
	blind_track = {
		'preview_url': track.get('preview_url'),
	}
	await consumer.group_send(group_name, {
		'type': 'game.round_started',
		'round_number': round_num,
		'track': blind_track,
		'playback_duration': playback_duration,
	})
	
	# STEP 2: Wait for playback duration (allow answers)
	playback_end_time = time.time() + playback_duration
	
	# Store reference so handlers can access this round's state
	consumer.current_round_state = {
		'game_id': game_id,
		'round_num': round_num,
		'answers': answers_received,
	}
	
	while time.time() < playback_end_time:
		# Wait for playback duration
		# Players submit answers via _submit_answer handler which populates consumer.current_round_state['answers']
		await asyncio.sleep(0.1)  # Non-blocking wait
	
	# STEP 3: Auto-reveal to all after playback ends
	_log(f'game_loop.broadcast_track_revealed game_id={game_id} round={round_num}')
	await consumer.group_send(group_name, {
		'type': 'game.track_revealed',
		'track': track,  # Already serialized
	})
	
	# STEP 4: Calculate and store round results
	results = await process_round_answers(game_id, round_num, answers_received, track)
	
	# STEP 5: Break between rounds
	break_duration = await get_break_duration(game_id)
	max_rounds = await get_max_rounds(game_id)
	show_answers = await get_show_answers(game_id)
	
	if round_num < max_rounds:
		_log(f'game_loop.broadcast_round_end game_id={game_id} round={round_num} has_next=True')
		await consumer.group_send(group_name, {
			'type': 'game.round_end',
			'round_number': round_num,
			'results': results if show_answers else [],
			'next_round_in': break_duration,
		})
		
		# Sleep during break
		await asyncio.sleep(break_duration)
	else:
		# Last round - send final results
		_log(f'game_loop.broadcast_round_end game_id={game_id} round={round_num} has_next=False is_last=True')
		await consumer.group_send(group_name, {
			'type': 'game.round_end',
			'round_number': round_num,
			'results': results if show_answers else [],
			'is_last_round': True,
		})
	
	# Move to next track
	await update_game_round(game_id)
	# Broadcast the new round number so clients can react immediately
	current_round = await get_current_round(game_id)
	_log(f'game_loop.broadcast_round_advanced game_id={game_id} new_round={current_round}')
	await consumer.group_send(group_name, {
		'type': 'game.round_advanced',
		'round_number': current_round,
	})


@database_sync_to_async
def get_playlist_tracks(game_id: str) -> list:
	"""Return serialized tracks for the game's playlist in order.

	Returns a list of serialized track dicts. Uses prefetch_related to avoid
	lazy-loading inside async context.
	"""
	game = Game.objects.select_related('playlist').prefetch_related('playlist__tracks').get(uid=game_id)
	playlist = game.playlist
	if not playlist:
		return []
	tracks = list(playlist.tracks.all())
	return [TrackSerializer(t).data for t in tracks]


@database_sync_to_async
def set_current_track(game_id: str, track_itunes_id: int) -> None:
	"""Set the game's current_track to the given Track primary key (itunes_id)."""
	# Update using the primary key directly
	Game.objects.filter(uid=game_id).update(current_track_id=track_itunes_id)


async def process_round_answers(game_id: str, round_num: int,
								answers_received: dict, track: dict) -> dict:
	"""Process all answers received and store results."""
	results = {
		'correct_answer': {
			'artist': track.get('artist'),
			'song': track.get('title'),
		},
		'answers': []
	}
	
	for player_id, answer_data in answers_received.items():
		answer = answer_data['answer']
		is_correct = answer_data['is_correct']
		player_username = answer_data['player_username']

		results['answers'].append({
			'player_id': player_id,
			'player_name': player_username,
			'answer': answer,
			'is_correct': is_correct,
		})
	
	return results


async def finalize_game(consumer: Any, game_id: str, group_name: str) -> None:
	"""End the game and send final results."""
	await mark_game_finished(game_id)
	
	await consumer.group_send(group_name, {
		'type': 'game.game_completed',
	})


@database_sync_to_async
def get_game(game_id: str) -> Game:
	"""Fetch a Game by its UUID from the database."""
	return Game.objects.get(uid=game_id)

@database_sync_to_async
def get_current_track(game_id: str) -> dict:
	"""Fetch the current track for a game and return serialized data.

	Use select_related to ensure the FK is loaded in-sync and avoid
	any lazy-loading in async context.
	"""
	game = Game.objects.select_related('current_track').get(uid=game_id)
	track = game.current_track
	if not track:
		return None
	return TrackSerializer(track).data

@database_sync_to_async
def get_playback_duration(game_id: str) -> float:
	"""Get playback duration in seconds."""
	# Fetch scalar field directly to avoid any model instance related lookups
	val = Game.objects.filter(uid=game_id).values_list('playback_duration', flat=True).first()
	return val.total_seconds() if val else 0.0

@database_sync_to_async
def get_break_duration(game_id: str) -> float:
	"""Get break duration in seconds."""
	val = Game.objects.filter(uid=game_id).values_list('break_duration', flat=True).first()
	return val.total_seconds() if val else 0.0

@database_sync_to_async
def get_max_rounds(game_id: str) -> int:
	"""Get max rounds for a game."""
	return Game.objects.filter(uid=game_id).values_list('max_rounds', flat=True).first() or 0

@database_sync_to_async
def get_show_answers(game_id: str) -> bool:
	"""Get show_answers flag for a game."""
	return Game.objects.filter(uid=game_id).values_list('answer_public', flat=True).first() or False

@database_sync_to_async
def mark_game_finished(game_id: str) -> None:
	"""Mark a game as finished."""
	Game.objects.filter(uid=game_id).update(status='finished')

@database_sync_to_async
def update_game_round(game_id: str) -> None:
	"""Increment current round atomically using F expression."""
	Game.objects.filter(uid=game_id).update(current_round=F('current_round') + 1)


@database_sync_to_async
def get_current_round(game_id: str) -> int:
	"""Return the current_round value for the game as an int."""
	return Game.objects.filter(uid=game_id).values_list('current_round', flat=True).first() or 0


@database_sync_to_async
def set_game_status(game_id: str, status: str) -> None:
	"""Set the game's status; when starting, record `started_at` timestamp."""
	if status == 'playing':
		Game.objects.filter(uid=game_id).update(status='playing', started_at=timezone.now())
	else:
		Game.objects.filter(uid=game_id).update(status=status)
