"""Define automatic actions based on a designated trigger for the user module."""

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from friends.models import Friendship
from friends.serializers import FriendUserSerializer
from django.utils import timezone


def notif_payload(*, friendship=None, uid=None, kind, profile, relation,
                  request=None, date=None, read=False):
    """Compact notification builder.
    Accepts either a `friendship` object or explicit `uid`/`date`/`read`.
    """
    if friendship is not None:
        uid_val = str(friendship.uid)
        date_val = friendship.created_at.isoformat()
        read_val = friendship.read
    else:
        uid_val = uid
        date_val = date or timezone.now().isoformat()
        read_val = bool(read)

    ctx = {'relation': relation}
    if request is not None:
        ctx['request'] = request

    return {
        'uid': uid_val,
        'kind': kind,
        'from': FriendUserSerializer(profile, context=ctx).data,
        'date': date_val,
        'read': read_val,
    }


def profile_group_name(user) -> str | None:
    """Return the websocket group name for a user profile if available."""
    profile = getattr(user, 'profile', None)
    if profile is None:
        return None
    return f'user_{profile.uid}'


def group_send_safe(group_name: str | None, payload: dict[str, Any]) -> None:
    """Best-effort websocket broadcast that never breaks API writes."""
    if not group_name:
        return
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(group_name, payload)
    except Exception:
        return


@receiver(post_save, sender=Friendship)
def save_profile(sender: type[Friendship],
                 instance: Friendship,
                 created: bool,
                 update_fields: set[str] | None = None,
                 **kwargs: Any) -> None:
    """Trigger sending of notifications when new friendship record is saved/created."""
    if created:
        sender = instance.from_user.profile
        recipient_group = profile_group_name(instance.to_user)
        group_send_safe(
            recipient_group,
            {
                'type': 'send_notification',
                'payload': {
                    'target': 'friend_request',
                    'event': 'new_incoming',
                    'user': FriendUserSerializer(sender, context={'relation': 'incoming'}).data,
                },
            },
        )
        """Uses notif_payload() to build a full notification object, adds to the recipient's notification list"""
        group_send_safe(
            recipient_group,
            {
                'type': 'send_notification',
                'payload': {
                    'target': 'notif',
                    'event': 'new',
                    'notif': notif_payload(
                        profile=sender,
                        relation='incoming',
                        kind='friend_request',
                        uid=str(instance.uid),
                    ),
                },
            },
        )
        return

    if not update_fields or 'status' not in update_fields or instance.status != 'accepted':
        return

    accepter_profile = instance.to_user.profile
    requester_group = profile_group_name(instance.from_user)
    group_send_safe(
        requester_group,
        {
            'type': 'send_notification',
            'payload': {
                'target': 'notif',
                'event': 'new',
                'notif': notif_payload(
                    profile=accepter_profile,
                    relation='friends',
                    kind='friend_accepted',
                    uid=str(instance.uid),
                ),
            },
        },
    )
