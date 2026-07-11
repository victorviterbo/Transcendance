"""Define reaper task to clean up abandoned games."""

from datetime import timedelta

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.utils import timezone
from django.db.models import Q
from game.models import Game
from game.ws_game_db_helpers import _delete_aborted_game
from game.ws_game_shared import ACTIVE_GAMES
from project.defaults import lobby_timeout, finished_timeout

@shared_task
def reap_foresaken_waiting_games() -> None:
    """Find every game that has been in the loby for over 15 minutes and delete them."""
    cutoff_lobby = timezone.now() - timedelta(minutes=lobby_timeout)
    cutoff_finished = timezone.now() - timedelta(minutes=finished_timeout)

    print(f"Reaping games created before {cutoff_lobby}\n\n\n\n")
    stale_games = Game.objects.filter(
    Q(status='waiting', created_at__lte=cutoff_lobby) |
    Q(~Q(status='finished'), created_at__lte=cutoff_finished)
)
    channel_layer = get_channel_layer()
    print(f"Found stale games: {stale_games.count()}")
    for game in stale_games:
        print(f"Reaping game {game.uid}")
        group_name = f'game_{game.uid}'
        async_to_sync(channel_layer.group_send)(group_name, {
            'type': 'game_closed_event',
            'uid': str(game.uid),
        })
        if game.uid in ACTIVE_GAMES:
            if 'task' in ACTIVE_GAMES[game.uid]:
                task_to_cancel = ACTIVE_GAMES[game.uid]['task']
                task_to_cancel.cancel()
            ACTIVE_GAMES.pop(game.uid)
        game.delete()
    print(f"Deleted {stale_games.count()} stale games.")
    all_games = Game.objects.filter(status='waiting').all()
    return f"Deleted {', '.join([str(game.uid) for game in stale_games])}., found {''.join([str(game.uid) for game in all_games])}."