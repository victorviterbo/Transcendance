"""Handle all message sending to client during game."""

from typing import TYPE_CHECKING

from project.defaults import countdown_time

if TYPE_CHECKING:
    from project.consumers import GlobalConsumer

async def _send_track(consumer: 'GlobalConsumer',
                      serialized_game: dict,
                      serialized_track: dict) -> None:
    """Send the current track data to players at the start of a round."""
    track = consumer.current_game.current_track
    if not track:
        await consumer.group_send(consumer.game_group_name,{
                        'type': 'global_error_mssg',
                        'game': serialized_game,
                        'error_mssg': 'No track to send'
        })
        return
    event = {'type': 'game_round_start',
            'uid': serialized_game.get('uid'),
            'preview': serialized_track.get('preview'),
            'playbackDuration': consumer.current_game.playbackDuration,
            'round': consumer.current_game.current_round
        }
    await consumer.group_send(consumer.game_group_name, event)

async def _send_round_preview(consumer: 'GlobalConsumer',
                              serialized_game: dict,
                              serialized_track: dict) -> None:
    """Send the preview track before the round begins."""
    #TODO: REMOVE LOG
    print(f"Artist: {serialized_track.get('artist')}, Title: {serialized_track.get('title')}")
    await consumer.group_send(consumer.game_group_name, {
        'type': 'game_round_preview',
        'uid': serialized_game.get('uid'),
        'preview': serialized_track.get('preview'),
        'playbackDuration': consumer.current_game.playbackDuration,
        'round': consumer.current_game.current_round,
    })

async def _send_round_stats(consumer: 'GlobalConsumer',
                            serialized_round_stats: dict,
                            serialized_game: dict,
                            serialized_track: dict,
                            game_leaderboard: dict | None = None) -> None:
    """Send final game stats to players at the end of a game."""
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
            'is_last_round': (consumer.current_game.current_round
                                >= consumer.current_game.trackCount)}
    await consumer.group_send(consumer.game_group_name, event)

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
                             serialized_settings: dict) -> None:
    await consumer.group_send(consumer.game_group_name, {
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

async def _send_game_ended(consumer: 'GlobalConsumer', game_ended: dict) -> None:
    """Broadcast game_ended to all players."""
    await consumer.group_send(consumer.game_group_name, {
        'type': 'game_ended_event',
        'uid': game_ended['uid'],
        'self': game_ended['self'],
        'leaderboard': game_ended['leaderboard'],
        'history': game_ended['history']
    })
