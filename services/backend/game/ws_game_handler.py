"""WebSocket handlers for game module."""

import asyncio
from typing import Any

from channels.db import database_sync_to_async
from music.serializers import BlindSerializer, TrackSerializer
from project.defaults import default_pts
from rest_framework import serializers
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from thefuzz import fuzz
from userprofile.models import Profile

from game.models import Game
from game.serializers import GameUpdateSerializer
from game.services import apply_game_settings, format_validation_errors
from game.ws_game_loop import play_rounds_loop


@database_sync_to_async
def _get_game(consumer: Any, game_uid: str | None, req_membership: bool = True) -> Game | None:
	"""Fetch the Game instance for a given game_uid, and check for player's membership."""
	if not game_uid:
		return None
	if req_membership:
		return Game.objects.filter(uid=game_uid, players=consumer.profile).first()
	return Game.objects.filter(uid=game_uid).first()

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

async def handle_game_action(consumer: Any, content: dict) -> None:
	"""Route game events to appropriate handlers."""
	game_event = content.get('event')
	game_uid = content.get('game_uid')
	if game_event == 'join_game':
		consumer.current_game = await _get_game(consumer, game_uid, False)
		if not getattr(consumer, 'current_game', None):
			await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'Game not found'})
			return
		await _join_game(consumer, content)
		return

	if getattr(consumer, 'current_game', None) is None:
		consumer.current_game = await _get_game(consumer, game_uid, True)
		if getattr(consumer, 'current_game', None) is None:
			await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'Game not found for this player'})
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

async def _join_game(consumer: Any, content: dict) -> None:
	"""Join a game group."""
	profile_uid = str(consumer.profile.uid)
	profile_name = consumer.profile.username
	group_name = f'game_{consumer.current_game.uid}'
	
	player_added = await _add_player_to_game(consumer.current_game, consumer.profile)
	if not player_added:
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'Failed to join game'})
		return
	
	await consumer.add_to_layer(group_name)
	
	await consumer.group_send(group_name, {
		'type': 'game.player_joined',
		'player_name': profile_name,
		'player_uid': profile_uid,
	})
	
	await consumer.send_json({
		'target': 'game',
		'event': 'joined_game',
		'game_uid': str(consumer.current_game.uid),
	})

async def _start_game(consumer: Any, content: dict) -> None:
	"""Start a game session / Begin the round loop."""
	if not getattr(consumer, 'current_game', None):
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'No game context'})
		return

	game_uid = consumer.current_game.uid
	group_name = f'game_{game_uid}'

	# Broadcast: game started
	await consumer.group_send(group_name, {
		'type': 'game.game_started',
		'started_by': consumer._sender_name(),
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

	is_correct = await validate_answer(consumer.profile, game_uid, answer)

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
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'No game context'})
		return

	if consumer.current_game.status != 'waiting':
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'Game settings can only be changed before the game starts'})
		return

	game_uid = str(consumer.current_game.uid)
	group_name = f'game_{game_uid}'
	settings_payload = {key: value for key, value in content.items() if key not in {'target', 'event', 'game_uid'}}

	try:
		updated_game = await database_sync_to_async(apply_game_settings)(consumer.current_game, settings_payload, partial=True)
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
		await consumer.send_json({'target': 'game', 'event': 'error', 'message': 'No game context'})
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
		game_id: UUID of the game
	
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
def validate_answer(player: Profile, game_uid: str, answer: str) -> bool:
	"""Validate answer against current track and return correctness.
	
	Args:
		player: The player profile
		game_id: UUID of the game
		answer: Player's answer (song title or artist name)
	
	Returns:
		bool: Whether the answer is correct
	"""
	try:
		game = Game.objects.get(uid=game_uid)
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
