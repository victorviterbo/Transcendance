"""Define automatic actions based on a designated trigger for the user module."""

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from friends.models import Friendship
from friends.serializers import FriendUserSerializer


def _profile_group_name(user) -> str | None:
    """Return the websocket group name for a user profile if available."""
    profile = getattr(user, 'profile', None)
    if profile is None:
        return None
    return f'user_{profile.id}'


def _profile_payload(profile, relation: str) -> dict[str, Any]:
    """Return a frontend-shaped user payload for realtime social events."""
    serializer = FriendUserSerializer(profile, context={'relation': relation})
    return serializer.data


def _notif_payload(from_profile, relation: str) -> dict[str, Any]:
    """Return a frontend-shaped notification payload."""
    return {
        'kind': 'friend-request',
        'from': _profile_payload(from_profile, relation),
        'date': friendship_timestamp(),
        'read': False,
    }


def friendship_timestamp() -> str:
    """Return an ISO timestamp string for websocket notification events."""
    from django.utils import timezone

    return timezone.now().isoformat()


def _group_send_safe(group_name: str | None, payload: dict[str, Any]) -> None:
    """Best-effort websocket broadcast that never breaks API writes."""
    if not group_name:
        return

    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    try:
        async_to_sync(channel_layer.group_send)(group_name, payload)
    except Exception:
        # Realtime delivery must not fail the HTTP friendship lifecycle.
        return


@receiver(post_save, sender=Friendship)
def save_profile(sender: type[Friendship],
                 instance: Friendship,
                 created: bool,
                 **kwargs: Any) -> None:
    """Trigger sending of notifications when friendship is saved."""
    if created:
        sender_profile = instance.from_user.profile
        recipient_group = _profile_group_name(instance.to_user)

        _group_send_safe(
            recipient_group,
            {
                'type': 'send_notification',
                'payload': {
                    'target': 'friend-request',
                    'event': 'new-incoming',
                    'user': _profile_payload(sender_profile, relation='incoming'),
                },
            },
        )

        _group_send_safe(
            recipient_group,
            {
                'type': 'send_notification',
                'payload': {
                    'target': 'notif',
                    'event': 'new',
                    'notif': _notif_payload(sender_profile, relation='incoming'),
                },
            },
        )
    else:
        accepter_profile = instance.to_user.profile
        requester_group = _profile_group_name(instance.from_user)
        _group_send_safe(
            requester_group,
            {
                'type': 'send_notification',
                'payload': {
                    'target': 'notif',
                    'event': 'new',
                    'notif': _notif_payload(accepter_profile, relation='friends'),
                },
            },
        )
