"""Define automatic actions based on a designated trigger for the user module."""

from typing import Any

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from .models import Profile, SiteUser


@receiver(post_save, sender=SiteUser)
def create_profile(sender: type[SiteUser],
                   instance: SiteUser,
                   created: bool,
                   **kwargs: Any) -> None:
    """Trigger creation of profile after creating a user."""
    if created:
        Profile.objects.create(user=instance)
    
@receiver(post_save, sender=SiteUser)
def save_profile(sender: type[SiteUser],
                 instance: SiteUser,
                 **kwargs: Any) -> None:
    """Trigger updating of profile after updating a user."""
    instance.profile.save()

@receiver(pre_delete, sender=SiteUser)
def delete_profile(sender, instance, **kwargs) -> None:
    """Trigger destruction of profile before destroying a user."""
    instance.profile.delete()
