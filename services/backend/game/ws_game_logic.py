"""WebSocket handlers for game module."""

import asyncio
from contextlib import suppress
from typing import TYPE_CHECKING

import channels.layers
from asgiref.sync import async_to_sync
from project.defaults import answer_buffer_time, countdown_time, max_players
from rest_framework import serializers

from game.models import Game
from game.services import format_validation_errors

from .ws_game_db_helpers import (
    _add_player_to_game_stats,
    _apply_game_settings,
    _check_game_membership,
    _compute_game_stats,
    _compute_round_stats,
    _get_game,
    _get_game_data,
    _get_game_settings_data,
    _get_num_curr_players,
    _get_player_data,
    _get_round_stats_completeness,
    _get_track_reveal_data,
    _init_round_stats,
    _remove_player_from_game_stats,
    _set_current_round,
    _setup_game_assets,
    _validate_answer,
)
from .ws_game_send_helpers import (
    _send_game_stats,
    _send_new_player,
    _send_round_stats,
    _send_start_signal,
    _send_track,
)

if TYPE_CHECKING:
    from project.consumers import GlobalConsumer

# Global dict (shared by all consumers) that keeps track of active games
ACTIVE_GAMES = {}

async def handle_game_action(consumer: 'GlobalConsumer', content: dict) -> None:
    """Route game events to appropriate handlers."""
    game_event = content.get('event')
    game_uid = content.get('uid')
    if not consumer.profile:
        await consumer.send_json({'target': 'game',
                            'event': 'error',
                            'message': 'Could not identify player'})
    
    if game_event == 'join_game':
        await join_game(consumer, content)
        return
    consumer.current_game = await _get_game(consumer, game_uid, True)
    if getattr(consumer, 'current_game', None) is None:
        await consumer.send_json({'target': 'game',
                                'event': 'error',
                                'message': 'Game not found for this player'})
        return
    if getattr(consumer, 'game_group_name', None) is None:
        consumer.game_group_name = f'game_{consumer.current_game.uid}'
        await consumer.add_to_layer(consumer.game_group_name)
    match game_event:
        case 'start_game':
            await _start_game(consumer, content)
        case 'update_settings':
            await _update_game_settings(consumer, content)
        case 'submit_answer':
            await _submit_answer(consumer, content)
        case 'leave_game':
            await _leave_game(consumer, content)
        case _:
            await consumer.send_json({'target': 'game',
                            'event': 'error',
                            'message': f'Unknown game event: {game_event}'})


async def run_game_loop(consumer: 'GlobalConsumer', content: dict) -> None:
    """Run the main game loop, cycling through rounds and sending updates."""
    try:
        await _setup_game_assets(consumer.current_game)
        serialized_game = await _get_game_data(consumer)
        await _send_start_signal(consumer, serialized_game)
        buffer_time = countdown_time + answer_buffer_time
        await asyncio.sleep(buffer_time)
        for round in range(1, consumer.current_game.trackCount + 1):
            ACTIVE_GAMES[consumer.current_game.uid]['all_answers_received'].clear()
            await _set_current_round(consumer.current_game, round)
            await _init_round_stats(consumer.current_game)
            buffer_time = answer_buffer_time
            serialized_game = await _get_game_data(consumer)
            serialized_track_full, serialized_track_blind = (
                await _get_track_reveal_data(consumer, content)
            )
            await _send_track(consumer, serialized_game, serialized_track_blind)
            with suppress(TimeoutError):
                await asyncio.wait_for(
                    ACTIVE_GAMES[consumer.current_game.uid]['all_answers_received'].wait(),
                    timeout=consumer.current_game.playbackDuration
                        + buffer_time
                )
            round_stats = await _compute_round_stats(consumer.current_game)
            serialized_game = await _get_game_data(consumer)
            await _send_round_stats(consumer,
                                    round_stats,
                                    serialized_game,
                                    serialized_track_full)
            await asyncio.sleep(consumer.current_game.breakDuration)
        game_stats = await _compute_game_stats(consumer.current_game)
        await _send_game_stats(consumer, game_stats, serialized_game)
    except serializers.ValidationError as e:
        await consumer.send_json({'target': 'game',
                                'event': 'error',
                                'message': str(e)})
    except asyncio.CancelledError:
        pass
    finally:
        ACTIVE_GAMES.pop(consumer.current_game.uid, None)

async def join_game(consumer: 'GlobalConsumer', content: dict) -> None:
    """Define the process to join a game."""
    if getattr(consumer, 'current_game', None):
        await consumer.send_json({'target': 'game',
                                'event': 'error',
                                'message': 'Already in a game'})
        return
    game_uid = content.get('uid')
    if game_uid is None:
        await consumer.send_json({'target': 'game',
                                'event': 'error',
                                'message': 'uid: missing field'})
        return
    consumer.current_game = await _get_game(consumer, game_uid, False)
    if not getattr(consumer, 'current_game', None):
        await consumer.send_json({'target': 'game',
                                'event': 'error',
                                'message': 'Game not found'})
        return
    num_current_players = await _get_num_curr_players(consumer.current_game)
    if num_current_players >= max_players:
        await consumer.send_json({'target': 'game',
                                'event': 'error',
                                'message': 'Game already full'})
        return
    num_current_players = await _get_num_curr_players(consumer.current_game)
    if num_current_players >= max_players:
        await consumer.send_json({'target': 'game',
                                'event': 'error',
                                'message': 'Game already full'})
        return
    is_already_in_game = await _check_game_membership(consumer.current_game,
                                                    consumer.profile)
    if is_already_in_game:
        await consumer.send_json({'target': 'game',
                                'event': 'player_joined',
                                'message': 'Already in game.'})
        return
    if getattr(consumer, 'game_group_name', None) is None:
        consumer.game_group_name = f'game_{consumer.current_game.uid}'
        await _add_user_to_players(consumer, content)
    return


async def _start_game(consumer: 'GlobalConsumer', content: dict) -> None:
    """Start a game session / Begin the round loop."""
    if not getattr(consumer, 'current_game', None):
        await consumer.send_json({'target': 'game',
                            'event': 'error',
                            'message': 'No game context'})
        return
    if (consumer.current_game.uid in ACTIVE_GAMES):
        await consumer.send_json({'target': 'game',
                                  'event': 'error',
                                  'message': 'Game already started'})
        return
    ACTIVE_GAMES[consumer.current_game.uid] = {
            "task": asyncio.create_task(run_game_loop(consumer, content)),
            "all_answers_received": asyncio.Event(),
        }

async def _add_user_to_players(consumer: 'GlobalConsumer', content: dict) -> None:
    """Handle the game joining process."""
    player_added = await _add_player_to_game_stats(consumer.current_game,
                                                consumer.profile)
    if not player_added:
        await consumer.send_json({'target': 'game',
                            'event': 'error',
                            'message': 'Failed to join game'})
        return
    await consumer.add_to_layer(consumer.game_group_name)
    serialized_game = await _get_game_data(consumer)
    serialized_player = await _get_player_data(consumer)
    await _send_new_player(consumer, serialized_game, serialized_player)
    return


async def _submit_answer(consumer: 'GlobalConsumer', content: dict) -> None:
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

    track_data, _ = await _get_track_reveal_data(consumer, content)
    assert track_data is not None
    artist_correct, title_correct = await _validate_answer(consumer,
                                                        content,
                                                        track_data)
                        
    if ((artist_correct or title_correct)
        and consumer.current_game.mode == 'armageddon'):
        await check_all_answers_received(consumer, consumer.current_game)
    
    serialized_game = await _get_game_data(consumer)
    serialized_player = await _get_player_data(consumer)
    if artist_correct or title_correct:
        if consumer.current_game.mode == 'armageddon':
            # if mode is armageddon, send the response to everyone
            await consumer.group_send(consumer.game_group_name, {
                'type': 'game_answer_correct',
                'game': serialized_game,
                'senderPlayer': serialized_player,
                'answer': answer,
                'trackArtist': track_data['artist'] if artist_correct else None,
                'tracktitle': track_data['title'] if title_correct else None,
                'is_correct': True
            })
        else:
            # else send only to player who send the correct response
            await consumer.send_json({
                'target': 'game',
                'event': 'answer_correct',
                'game': serialized_game,
                'trackArtist': track_data['artist'] if artist_correct else None,
                'tracktitle': track_data['title'] if title_correct else None,
                'answer': answer,
                'is_correct': True,
            })
    else:
        if consumer.current_game.reveal:
            #Broadcast wrong answer to everyone
            await consumer.group_send(consumer.game_group_name, {
                'type': 'game_answer_incorrect',
                'game': serialized_game,
                'senderPlayer': serialized_player,
                'answer': answer,
                'is_correct': False
                })
        else:
            # Tell incorrect players their answer was wrong
            await consumer.send_json({
                'target': 'game',
                'event': 'answer_incorrect',
                'game': serialized_game,
                'answerString': answer,
                'is_correct': False
                })


async def _update_game_settings(consumer: 'GlobalConsumer', content: dict) -> None:
    """Apply game settings through the shared PATCH logic and broadcast the result."""
    if consumer.current_game.status != 'waiting':
        await consumer.send_json({'target': 'game',
                            'event': 'error',
                            'message': 'Game settings can only be changed before'
                            'the game starts'})
        return
    if consumer.profile.uid != consumer.current_game.owned_by.uid:
        await consumer.send_json({'target': 'game',
                            'event': 'error',
                            'message': 'Only owner can edit game'})
        return
    settings_payload = {key: value for key, value in content.items() if key not in
                        {'target', 'event'}}
    try:
        updated_game = await _apply_game_settings(consumer.current_game,
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
    serialized_game = await _get_game_data(consumer)
    settings_data = await _get_game_settings_data(consumer)
    await consumer.group_send(consumer.game_group_name, {
        'type': 'game_settings_updated',
        'uid': serialized_game.get('uid'),
        'settings': settings_data,
    })


async def _leave_game(consumer: 'GlobalConsumer', content: dict) -> None:
    """Leave a game group."""
    if not getattr(consumer, 'current_game', None):
        await consumer.send_json({'target': 'game',
                            'event': 'error',
                            'message': 'No game context'})
        return
    
    await _remove_player_from_game_stats(consumer.current_game, consumer.profile)
    
    serialized_game = await _get_game_data(consumer)
    serialized_player = await _get_player_data(consumer)
    await consumer.group_send(consumer.game_group_name, {
        'type': 'game_player_left',
        'game': serialized_game,
        'player': serialized_player,
    })
    await consumer.remove_from_layer(consumer.game_group_name)
    consumer.current_game = None
    consumer.game_group_name = None
    await consumer.send_json({
        'target': 'game',
        'event': 'left_game',
        'game': serialized_game,
    })


async def check_all_answers_received(consumer: 'GlobalConsumer', game: Game) -> None:
    """Unlocks the game loop if both artist and title has been found."""
    found = await _get_round_stats_completeness(game)
    game_over = found['titles'] > 0 and found['artists'] > 0
    if game_over:
        ACTIVE_GAMES[consumer.current_game.uid]['all_answers_received'].set()

