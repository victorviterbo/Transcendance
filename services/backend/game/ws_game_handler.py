"""WebSocket handlers for game module."""

import asyncio
from typing import Any

from channels.db import database_sync_to_async
from music.serializers import BlindSerializer, TrackSerializer
from project.defaults import default_pts
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from thefuzz import fuzz
from userprofile.models import Profile

from services.backend.game.ws_game_loop import play_rounds_loop
from game.models import Game


async def handle_game_action(consumer: Any, content: dict) -> None:
	"""Route game events to appropriate handlers."""
	game_event = content.get('event')

	match game_event:
		case 'join_room':
			await _join_game_room(consumer, content)
		case 'start_game':
			await _start_game(consumer, content)
		case 'submit_answer':
			await _submit_answer(consumer, content)
		# case 'reveal_track':
		# 	await _reveal_track(consumer, content)
		case 'leave_room':
			await _leave_game_room(consumer, content)
		case _:
			await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': f'Unknown game event: {game_event}'})

async def _join_game_room(consumer: Any, content: dict) -> None:
	"""Join a game room group."""
	game_id = content.get('game_id')
	if not game_id:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'game_id required'})
		return
	
	profile_id = consumer.profile.id
	profile_name = consumer.profile.username
	group_name = f'game_{game_id}'
	await consumer.add_to_layer(group_name)
	
	await consumer.group_send(group_name, {
		'type': 'game.player_joined',
		'player_name': profile_name,
		'player_id': profile_id,
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'joined_room',
		'game_id': game_id,
	})

async def _start_game(consumer: Any, content: dict) -> None:
	"""Start a game session / Begin the round loop."""
	game_id = content.get('game_id')
	if not game_id:
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'game_id required'})
		return

	group_name = f'game_{game_id}'

	# Broadcast: game started
	await consumer.group_send(group_name, {
		'type': 'game.game_started',
		'started_by': consumer._sender_name(),
		'game_id': game_id,
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'game_started',
	})
	# START THE ROUND LOOP IN BACKGROUND so this client can keep receiving broadcasts
	# (awaiting the loop here blocks the same consumer from handling group events).
	if not hasattr(consumer, '_game_loop_tasks'):
		consumer._game_loop_tasks = {}
	if game_id in consumer._game_loop_tasks and not consumer._game_loop_tasks[game_id].done():
		return
	consumer._game_loop_tasks[game_id] = asyncio.create_task(play_rounds_loop(consumer, game_id))


async def _submit_answer(consumer: Any, content: dict) -> None:
	"""Submit an answer to current game question."""
	game_id = content.get('game_id')
	answer = content.get('answer')
	answer_time = content.get('answer_time')
	
	if not game_id or answer is None or answer_time is None:
		await consumer.send_json({'target': 'game',
							'event': 'error',
							'message': 'game_id, answer, and answer_time required'})
		return

	# Check if the player is in playback phase
	if not hasattr(consumer, 'current_round_state'):
		await consumer.send_json({
			'target': 'game',
			'event': 'error',
			'message': 'No active round'
		})
		return
	
	profile_id = consumer.profile.id
	profile_name = consumer.profile.username
	track = await get_track_reveal_data(game_id)

	is_correct = await validate_answer(consumer.profile, game_id, answer)

	consumer.current_round_state['answers'][profile_id] = {
		'answer': answer,
		'time': answer_time,
		'is_correct': is_correct,
		'player_id': profile_id,
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
	await consumer.group_send(f'game_{game_id}', {
		'type': 'game.player_answered',
		'player_name': profile_name,
	})

		
async def _leave_game_room(consumer: Any, content: dict) -> None:
	"""Leave a game room group."""
	game_id = content.get('game_id')
	if not game_id:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'game_id required'})
		return

	profile_id = consumer.profile.id
	profile_name = consumer.profile.username
	group_name = f'game_{game_id}'
	await consumer.remove_from_layer(group_name)
	
	await consumer.group_send(group_name, {
		'type': 'game.player_left',
		'player_name': profile_name,
		'player_id': profile_id,
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
	"""  # noqa: D206
	try:
		game = Game.objects.get(uid=game_id)
		if not game.current_track:
			return None
		track_data = TrackSerializer(game.current_track).data
		return track_data
	except Game.DoesNotExist:
		return None

@database_sync_to_async
def validate_answer(player: Profile, game_id: str, answer: str) -> bool:
	"""Validate answer against current track and return correctness.
	
	Args:
		player: The player profile
		game_id: UUID of the game
		answer: Player's answer (song title or artist name)
	
	Returns:
		bool: Whether the answer is correct
	"""  # noqa: D206
	try:
		game = Game.objects.get(uid=game_id)
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
			if fuzz.partial_ratio(player_answer, track_artist) >= 80:
				player_stats.artist_found = True
				player_stats.save(update_fields=['artist_found'])
				return True
		if not player_stats.title_found:
			track_title = game.current_track.title.lower().strip()
			if fuzz.partial_ratio(player_answer, track_title) >= 80:
				player_stats.title_found = True
				player_stats.save(update_fields=['title_found'])
				return True
		return False
	except Game.DoesNotExist:
		return False

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
def _compute_xp_earned(game: Game, round_number: int) -> None:
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
