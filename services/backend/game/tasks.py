"""Define reaper task to clean up abandoned games."""

from datetime import timedelta

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.utils import timezone
from ws_game_shared import ACTIVE_GAMES

from game.models import Game


@shared_task
def reap_foresaken_waiting_games():
    """Find every game that has been in the loby for over 15 minutes and delete them."""
    cutoff = timezone.now() - timedelta(minutes=1)
    stale_games = Game.objects.filter(
        status='waiting',
        created_at__lte=cutoff
    )
    channel_layer = get_channel_layer()
    for game in stale_games:
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
    deleted_count, _ = stale_games.delete()
    return