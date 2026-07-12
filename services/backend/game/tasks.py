"""Define reaper task to clean up abandoned games."""

from datetime import timedelta

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.db.models import Q
from django.utils import timezone
from game.models import Game
from project.defaults import lobby_timeout, stale_timeout


def _delete_game_with_runtime_data(game: Game) -> None:
    """Remove a stale game and the temporary room and playlist it owns."""
    if game.room_id:
        game.room.delete()
    if game.playlist_id:
        game.playlist.delete()
    game.delete()


@shared_task
def reap_foresaken_waiting_games() -> str:
    """Clean abandoned lobbies and signal stale active games."""
    now = timezone.now()
    cutoff_lobby = now - timedelta(minutes=lobby_timeout)
    cutoff_active = now - timedelta(minutes=stale_timeout)

    stale_waiting = list(Game.objects.filter(
        status='waiting',
        created_at__lte=cutoff_lobby,
    ))
    stale_aborted = list(Game.objects.filter(status='aborted'))
    stale_active = list(Game.objects.filter(
        status__in=['playing_round', 'playing_break'],
    ).filter(
        Q(last_activity_at__isnull=True) |
        Q(last_activity_at__lte=cutoff_active),
    ))

    channel_layer = get_channel_layer()
    for game in stale_aborted:
        _delete_game_with_runtime_data(game)

    for game in stale_waiting:
        group_name = f'game_{game.uid}'
        async_to_sync(channel_layer.group_send)(group_name, {
            'type': 'game_closed_event',
            'uid': str(game.uid),
        })
        _delete_game_with_runtime_data(game)

    for game in stale_active:
        marked = Game.objects.filter(
            pk=game.pk,
            status__in=['playing_round', 'playing_break'],
        ).update(status='aborted')
        if marked:
            group_name = f'game_{game.uid}'
            async_to_sync(channel_layer.group_send)(group_name, {
                'type': 'game_abort_event',
                'uid': str(game.uid),
            })

    return (
        f"Deleted {len(stale_aborted) + len(stale_waiting)} games and "
        f"marked {len(stale_active)} active games as aborted."
    )
