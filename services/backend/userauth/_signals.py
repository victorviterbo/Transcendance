"""Define automatic actions based on a designated trigger for the user module."""

from typing import Any

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from userprofile.models import Profile

from .models import SiteUser


@receiver(post_save, sender=SiteUser)
def save_profile(sender: type[SiteUser],
                 instance: SiteUser,
                 **kwargs: Any) -> None:
    """Trigger updating of profile after updating a user."""
    if not instance.is_superuser:
        instance.profile.save()
