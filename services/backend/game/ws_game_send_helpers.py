"""Handle all message sending to client during game."""

from typing import TYPE_CHECKING

from chat.ws_game_chat import add_gameroom_participant, send_join_chatroom
from project.defaults import countdown_time

from game.models import Game
from .ws_game_db_helpers import _get_game_info_data

if TYPE_CHECKING:
    from project.consumers import GlobalConsumer

async def _send_game_error(consumer: 'GlobalConsumer', game_uid: str , message: str, critical: bool = False) -> None:
    """Send a game error payload for the current game."""
    await consumer.send_json({
        'target': 'game',
        'event': 'error',
        'uid': str(game_uid),
        'self': consumer.profile_data,
        'message': message,
        'critical': critical,
        'currentGameUid': str(consumer.current_game.uid)
                            if (message == 'ALREADY_IN_GAME') else None
    })

async def _send_existing_player_game_info(consumer: 'GlobalConsumer') -> None:
    """Reconnect an existing game member to the websocket game session."""
    consumer.game_group_name = f'game_{consumer.current_game.uid}'
    if consumer.game_group_name not in consumer.active_layers:
        await consumer.add_to_layer(consumer.game_group_name)
    await add_gameroom_participant(consumer.current_game, consumer.profile)
    await send_join_chatroom(consumer)
    serialized_game_info = await _get_game_info_data(consumer)
    await _send_game_info(consumer, serialized_game_info)

async def _send_track(consumer: 'GlobalConsumer',
                      serialized_game: dict,
                      serialized_track: dict,
                      group_name: str | None = None,
                      game: Game | None = None) -> None:
    """Send the current track data to players at the start of a round."""
    if game is None:
        game = consumer.current_game
    if group_name is None:
        group_name = consumer.game_group_name
    
    track = game.current_track
    if not track:
        await consumer.group_send(group_name, {
                        'type': 'global_error_mssg',
                        'game': serialized_game,
                        'error_mssg': 'No track to send'
        })
        return
    event = {'type': 'game_round_start',
            'uid': serialized_game.get('uid'),
            'preview': serialized_track.get('preview'),
            'playbackDuration': game.playbackDuration,
            'round': game.current_round
        }
    await consumer.group_send(group_name, event)

async def _send_round_preview(consumer: 'GlobalConsumer',
                              serialized_game: dict,
                              serialized_track: dict,
                              group_name: str | None = None,
                              game: Game | None = None) -> None:
    """Send the preview track before the round begins."""
    if game is None:
        game = consumer.current_game
    if group_name is None:
        group_name = consumer.game_group_name
    
    #TODO: REMOVE LOG
    print(f"Artist: {serialized_track.get('artist')}, Title: {serialized_track.get('title')}")
    await consumer.group_send(group_name, {
        'type': 'game_round_preview',
        'uid': serialized_game.get('uid'),
        'preview': serialized_track.get('preview'),
        'playbackDuration': game.playbackDuration,
        'round': game.current_round,
    })

async def _send_round_stats(consumer: 'GlobalConsumer',
                            serialized_round_stats: dict,
                            serialized_game: dict,
                            serialized_track: dict,
                            game_leaderboard: dict | None = None,
                            group_name: str | None = None,
                            game: Game | None = None) -> None:
    """Send final game stats to players at the end of a round."""
    if game is None:
        game = consumer.current_game
    if group_name is None:
        group_name = consumer.game_group_name
    
    if isinstance(serialized_round_stats, list):
        round_leaderboard = serialized_round_stats
        results = serialized_round_stats
    else:
        round_leaderboard = serialized_round_stats.get('leaderboard', [])
        results = serialized_round_stats.get('results', [])
    event = {'type': 'game_round_end',
            'uid': serialized_game.get('uid'),
            'track': serialized_track,
            'leaderboard': game_leaderboard if game_leaderboard else round_leaderboard,
            'results': results,
            'is_last_round': (game.current_round >= game.trackCount)}
    await consumer.group_send(group_name, event)

async def _send_game_stats(consumer: 'GlobalConsumer',
                           serialized_stats: dict,
                           serialized_game: dict) -> None:
    """Send final game stats to players at the end of a game."""
    await consumer.group_send(consumer.game_group_name, {
        'type': 'game_completed',
        'game': serialized_game,
        'leaderboard': serialized_stats
        })

async def _send_new_player(consumer: 'GlobalConsumer',
                            serialized_game: dict,
                            serialized_player: dict) -> None:
    await consumer.group_send(consumer.game_group_name, {
        'type': 'game_player_joined',
        'uid': serialized_game.get('uid'),
        'player': serialized_player
    })

async def _send_start_signal(consumer: 'GlobalConsumer',
                             serialized_game: dict,
                             serialized_settings: dict,
                             group_name: str | None = None) -> None:
    if group_name is None:
        group_name = consumer.game_group_name
    await consumer.group_send(group_name, {
        'type': 'game_start_signal',
        'uid': serialized_game.get('uid'),
        'settings': serialized_settings,
        'delay': countdown_time,
    })

async def _send_game_info(consumer: 'GlobalConsumer', game_info: dict) -> None:
    """Send game_info directly to the joining player."""
    await consumer.send_json({
        'target': 'game',
        'event': 'game_info',
        'uid': game_info['uid'],
        'self': game_info['self'],
        'game': game_info['game'],
        'settings': game_info['settings'],
        'leaderboard': game_info['leaderboard'],
        'history': game_info['history']
    })

async def _send_game_ended(consumer: 'GlobalConsumer', game_ended: dict, group_name: str | None = None) -> None:
    """Broadcast game_ended to all players."""
    if group_name is None:
        group_name = consumer.game_group_name
    await consumer.group_send(group_name, {
        'type': 'game_ended_event',
        'uid': game_ended['uid'],
        'leaderboard': game_ended['leaderboard'],
    })


async def _send_game_restarted(
    consumer: 'GlobalConsumer',
    group_name: str,
    old_game_uid: str,
    new_game_uid: str,
) -> None:
    """Broadcast a restart event so clients can redirect to the fresh game."""
    await consumer.group_send(group_name, {
        'type': 'game_restarted_event',
        'uid': old_game_uid,
        'newGame': new_game_uid,
    })

async def _send_game_closed(consumer: 'GlobalConsumer', game_uid: str, group_name: str | None = None) -> None:
    """Broadcast a game closed event to all players."""
    if group_name is None:
        group_name = consumer.game_group_name
    await consumer.group_send(group_name, {
        'type': 'game_closed_event',
        'uid': str(game_uid),
        'self': consumer.profile_data,
    })