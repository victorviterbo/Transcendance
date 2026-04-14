"""Define the Profiles and Friendships of users."""

from __future__ import annotations

import random
import shutil
import uuid
from pathlib import Path

from django.db import models
from project import settings
from project.defaults import badges_strings
from userauth.models import SiteUser


def avatar_path(instance: Profile, filename: str) -> str:
    """Construct the path at wich the profile picture will be stored."""
    return f'avatars/user_{instance.pk}_profile.png'

def pick_random_avatar() -> str:
    """Pick a random avatar as the default."""
    return f'default_avatars/default_avatar_{random.randrange(0, 18)}.png'

class Profile(models.Model):
    """Define the structure of the Profile, based on a generic model."""
    user = models.OneToOneField(SiteUser,
                                on_delete=models.CASCADE,
                                null=True, # if anonymous user (not logged in)
                                related_name='profile')
    
    username = models.CharField(max_length=20,
                                default="Anonymous",
                                unique=True,
                                null=False)
    
    avatar = models.ImageField(default=pick_random_avatar,
                              upload_to=avatar_path)
    
    exp_points = models.IntegerField(default=0)

    badges = models.CharField(max_length=30,
                              default=badges_strings[0],
                              choices=[(b, b) for b in badges_strings])
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)

    is_guest = models.BooleanField(default=True)

    is_online = models.BooleanField(default=True)
    
    last_active = models.DateTimeField(auto_now=True)

    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)


    class Meta:
        """Enforce uniqueness only if the username is not Anonymous."""
        constraints = [
            models.UniqueConstraint(
                fields=['username'],
                name='unique_username_unless_anonymous',
                condition=~models.Q(username='Anonymous') 
            )
        ]
    
    def save(self, *args, **kwargs) -> None:
        """Override save to give each new profile its own copy of the default avatar.

        django-cleanup deletes the old file whenever the avatar field changes.
        Default avatars are shared files, so without this override every upload
        would delete a shared file and break other profiles using it.
        By copying the default to a personal path on creation, only the user's
        own file is ever deleted on subsequent updates.
        """
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and self.avatar and 'default_avatars/' in str(self.avatar):
            src = Path(settings.MEDIA_ROOT) / str(self.avatar)
            dst_name = f'avatars/user_{self.pk}_profile.png'
            dst = Path(settings.MEDIA_ROOT) / dst_name
            dst.parent.mkdir(parents=True, exist_ok=True)
            if src.exists():
                shutil.copy2(src, dst)
            Profile.objects.filter(pk=self.pk).update(avatar=dst_name)
            self.avatar.name = dst_name

    def __str__(self) -> str:
        """Define how to output the object as string."""
        return f'{self.username} Profile'
    
