"""WebSocket handlers for game module."""

from typing import Any

from channels.db import database_sync_to_async
from game.models import Game
from music.serializers import TrackSerializer


async def handle_game_action(consumer: Any, content: dict) -> None:
    """Route game events to appropriate handlers."""
    event = content.get('event')

    match event:
        case 'join_room':
            await _join_game_room(consumer, content)
        case 'start_game':
            await _start_game(consumer, content)
        case 'submit_answer':
            await _submit_answer(consumer, content)
        case 'reveal_track':
            await _reveal_track(consumer, content)
        case 'leave_room':
            await _leave_game_room(consumer, content)
        case _:
            await consumer.send_json({'target': 'game', 'event': 'error', 'message': f'Unknown game event: {event}'})


async def _join_game_room(consumer: Any, content: dict) -> None:
	"""Join a game room group."""
	game_id = content.get('game_id')
	if not game_id:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'game_id required'})
		return

	group_name = f'game_{game_id}'
	await consumer.add_to_layer(group_name)
	
	await consumer.group_send(group_name, {
		'type': 'game.player_joined',
		'player_name': consumer._sender_name(),
		'player_id': consumer.profile.id,
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'joined_room',
		'game_id': game_id,
	})


async def _start_game(consumer: Any, content: dict) -> None:
	"""Start a game session."""
	game_id = content.get('game_id')
	if not game_id:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'game_id required'})
		return

	group_name = f'game_{game_id}'
	
	await consumer.group_send(group_name, {
		'type': 'game.game_started',
		'started_by': consumer._sender_name(),
		'game_id': game_id,
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'game_started',
	})


async def _reveal_track(consumer: Any, content: dict) -> None:
	"""Reveal the track for the current round with full details."""
	game_id = content.get('game_id')
	if not game_id:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'game_id required'})
		return

	group_name = f'game_{game_id}'
	
	# Get real track data from database
	track_data = await get_track_reveal_data(game_id)
	
	if not track_data:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'No track available'})
		return
	
	await consumer.group_send(group_name, {
		'type': 'game.track_revealed',
		'track': track_data,
		'game_id': game_id,
	})


async def _submit_answer(consumer: Any, content: dict) -> None:
	"""Submit an answer to current game question."""
	game_id = content.get('game_id')
	answer = content.get('answer')
	
	if not game_id or answer is None:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'game_id and answer required'})
		return

	group_name = f'game_{game_id}'
	
	# Validate answer against actual track
	is_correct, points_earned = await validate_answer(game_id, answer)
	
	# Save player answer to database
	saved = await save_player_answer(game_id, consumer.profile.id, points_earned, is_correct)
	if not saved:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'Failed to save answer'})
		return
	
	# Broadcast answer submission to all players in room
	await consumer.group_send(group_name, {
		'type': 'game.answer_submitted',
		'player_name': consumer._sender_name(),
		'player_id': consumer.profile.id,
		'answer': answer,
		'is_correct': is_correct,
		'points_earned': points_earned,
	})
	
	# Auto-reveal track so players see the correct answer
	track_data = await get_track_reveal_data(game_id)
	if track_data:
		await consumer.group_send(group_name, {
			'type': 'game.track_revealed',
			'track': track_data,
			'game_id': game_id,
		})


async def _leave_game_room(consumer: Any, content: dict) -> None:
	"""Leave a game room group."""
	game_id = content.get('game_id')
	if not game_id:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'game_id required'})
		return

	group_name = f'game_{game_id}'
	await consumer.remove_from_layer(group_name)
	
	await consumer.group_send(group_name, {
		'type': 'game.player_left',
		'player_name': consumer._sender_name(),
		'player_id': consumer.profile.id,
		'game_id': game_id,
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'left_room',
		'game_id': game_id,
	})


@database_sync_to_async
def get_track_reveal_data(game_id: str) -> dict | None:
	"""Get full track data for revealing to players.
	
	Args:
		game_id: UUID of the game
	
	Returns:
		dict with track details (title, artist, preview_url, artwork_url) or None
	"""
	try:
		game = Game.objects.get(uid=game_id)
		if not game.current_track:
			return None
		
		# Use TrackSerializer to get full track data
		track_data = TrackSerializer(game.current_track).data
		return track_data
	except Game.DoesNotExist:
		return None


@database_sync_to_async
def validate_answer(game_id: str, answer: str) -> tuple[bool, int]:
	"""Validate answer against current track and return correctness + points.
	
	Args:
		game_id: UUID of the game
		answer: Player's answer (song title or artist name)
	
	Returns:
		tuple: (is_correct: bool, points_earned: int)
	"""
	try:
		game = Game.objects.get(uid=game_id)
		if not game.current_track:
			return False, 0
		
		# Get track info
		track_title = game.current_track.title.lower().strip()
		track_artist = game.current_track.artist.lower().strip()
		player_answer = answer.lower().strip()
		
		# Check if answer matches title or artist (exact or partial match)
		is_correct = (
			player_answer == track_title 
			or player_answer == track_artist
			or player_answer in track_title
			or player_answer in track_artist
		)
		
		# Calculate points (10 base, can add speed bonus later)
		points = 10 if is_correct else 0
		
		return is_correct, points
	
	except Game.DoesNotExist:
		return False, 0


@database_sync_to_async
def save_player_answer(game_id: str, player_id: int, points_earned: int, is_correct: bool) -> bool:
	"""Save player's answer stats to database.
	
	Args:
		game_id: UUID of the game
		player_id: ID of the player profile
		points_earned: Points for this answer
		is_correct: Whether answer was correct
	
	Returns:
		bool: Success or failure
	"""
	from stats.models import UserGameStats, UserRoundStats, GameRoundStats
	from userprofile.models import Profile
	
	try:
		game = Game.objects.get(uid=game_id)
		player = Profile.objects.get(id=player_id)
		
		# Get or create game stats for this player
		game_stats, _ = UserGameStats.objects.get_or_create(
			game=game,
			player=player,
			defaults={'total_score': 0}
		)
		
		# Update total score
		game_stats.total_score += points_earned
		game_stats.save()
		
		# Get or create round stats
		round_stats, _ = GameRoundStats.objects.get_or_create(
			game=game,
			round_number=game.current_round,
			defaults={'track': game.current_track}
		)
		
		# Create user round stats
		UserRoundStats.objects.create(
			game=game,
			player=player,
			round=round_stats,
			track=game.current_track,
			is_won=is_correct,
			xp_earned=points_earned,
		)
		
		return True
	
	except (Game.DoesNotExist, Profile.DoesNotExist):
		return False
