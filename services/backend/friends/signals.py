"""Define automatic actions based on a designated trigger for the user module."""

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from friends.models import Friendship


@receiver(post_save, sender=Friendship)
def save_profile(sender: type[Friendship],
                 instance: Friendship,
                 created: bool,
                 **kwargs: Any) -> None:
    """Trigger sending of notifications when friendship is saved."""
    channel_layer = get_channel_layer()
    if created:
        user_group = f"user_{instance.to_user.id}"
        message = 'NEW_FRIEND_REQUEST'
        from_user = instance.from_user.username
    else:
        user_group = f"user_{instance.from_user.id}"
        message = 'FRIEND_REQUEST_ACCEPTED'
        from_user = instance.to_user.username
    async_to_sync(channel_layer.group_send)(
        user_group,
        {
            'type': 'send_notification', 
            'module': 'social',
            'message': message,
            'from-user': from_user
        }
    )