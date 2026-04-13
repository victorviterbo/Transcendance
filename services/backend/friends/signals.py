"""Define automatic actions based on a designated trigger for the user module."""

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from friends.models import Friendship


def _profile_group_name(user) -> str | None:
    """Return the websocket group name for a user profile if available."""
    profile = getattr(user, 'profile', None)
    if profile is None:
        return None
    return f'user_{profile.id}'


@receiver(post_save, sender=Friendship)
def save_profile(sender: type[Friendship],
                 instance: Friendship,
                 created: bool,
                 **kwargs: Any) -> None:
    """Trigger sending of notifications when friendship is saved."""
    channel_layer = get_channel_layer()
    if created:
        #user_group = f"user_{instance.to_user.id}"
        user_group = _profile_group_name(instance.to_user)
        message = 'NEW_FRIEND_REQUEST'
        from_user = instance.from_user.username
    else:
        #user_group = f"user_{instance.to_user.id}"
        user_group = _profile_group_name(instance.from_user)
        message = 'FRIEND_REQUEST_ACCEPTED'
        from_user = instance.to_user.username

    if not user_group:
        return

    async_to_sync(channel_layer.group_send)(
        user_group,
        {
            'type': 'send_notification', 
            'module': 'social',
            'message': message,
            'from_user': from_user,
            'from_user_uid': str(instance.from_user.uid),
            'to_user_uid': str(instance.to_user.uid),
            'friendship_uid': str(instance.uid),
        }
    )