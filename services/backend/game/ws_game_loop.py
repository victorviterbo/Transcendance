"""Game loop orchestration and round execution logic."""

import asyncio
import time
from typing import Any

from channels.db import database_sync_to_async
from django.utils import timezone
from music.serializers import TrackSerializer
from stats.models import UserGameStats, UserRoundStats

from game.models import Game


def _log(message: str) -> None:
	print(message, flush=False)


async def play_rounds_loop(consumer: Any, game_id: str) -> None:
	"""Main game loop that cycles through all rounds."""
	_log(f'game_loop.start game_id={game_id}')
	
	# Initialize game: fetch, setup config, serialize tracks, and mark as playing
	game, game_config, tracks_to_play = await init_game(game_id)
	group_name = f'game_{game_id}'
	_log(f'game_loop.playlist_fetched game_id={game_id} track_count={len(tracks_to_play)}')

	for idx, track in enumerate(tracks_to_play, start=1):
		_log(f"game_loop.round_start game_id={game_id} round={idx} track_id={track.get('itunes_id')}")
		# Set the current_track on the Game model for visibility
		game.current_track_id = track.get('itunes_id')
		# Play this round with the specific track
		await play_single_round(consumer, game, game_config, group_name, idx, track=track)
		_log(f'game_loop.round_end game_id={game_id} round={idx}')

	_log(f'game_loop.finished game_id={game_id}')
	# Mark game as finished
	game.status = 'finished'
	await save_game(game)


async def play_single_round(consumer: Any, game: Game, game_config: dict, group_name: str,
							round_num: int, track: dict | None = None) -> None:
	"""Execute one round: playback → answer collection → reveal → breaktime.
	
	Args:
		consumer: The websocket consumer broadcasting game events.
		game: The in-memory `Game` object being updated during the loop.
		game_config: Static game values extracted once at initialization.
		group_name: Channels group name used for broadcasts.
		round_num: The round index currently being played.
		track: Serialized track data for this round.
	"""
	game_id = game_config['game_id']
	# Local state for this round
	answers_received = {}  # {player_id: {'answer': str, 'time': float, 'is_correct': bool, 'player_id': int, 'player_username': str}}
	playback_duration = game_config['playback_duration']
	
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
	break_duration = game_config['break_duration']
	num_tracks = game_config['num_tracks']
	show_answers = game_config['answer_public']
	
	if round_num < num_tracks:
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
	
	# Move to next round
	game.current_round += 1
	await save_game(game)
	# Broadcast the new round number so clients can react immediately
	_log(f'game_loop.broadcast_round_advanced game_id={game_id} new_round={game.current_round}')
	await consumer.group_send(group_name, {
		'type': 'game.round_advanced',
		'round_number': game.current_round,
	})


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
			'player_uid': player_id,
			'player_name': player_username,
			'answer': answer,
			'is_correct': is_correct,
		})
	
	return results



@database_sync_to_async
def init_game(game_id: str) -> tuple[Game, dict, list]:
	"""Initialize game: fetch game with playlist, setup config, serialize tracks, mark as playing.
	
	Returns:
		Tuple of (game object, game_config dict, list of serialized tracks)
	"""
	game = Game.objects.select_related('playlist').prefetch_related('playlist__tracks').get(uid=game_id)
	
	# Setup game config from static fields
	game_config = {
		'game_id': game_id,
		'num_tracks': game.num_tracks,
		'playback_duration': game.playback_duration.total_seconds() if game.playback_duration else 0.0,
		'break_duration': game.break_duration.total_seconds() if game.break_duration else 0.0,
		'answer_public': game.answer_public,
	}
	
	# Extract and serialize playlist tracks (playlist already has only the needed songs)
	tracks = []
	if game.playlist:
		tracks = [TrackSerializer(t).data for t in game.playlist.tracks.all()]
	
	# Mark game as playing
	game.status = 'playing'
	game.started_at = timezone.now()
	game.save()
	
	return game, game_config, tracks


@database_sync_to_async
def save_game(game: Game) -> None:
	"""Persist game object changes to the database."""
	game.save()
