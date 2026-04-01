"""Define the Profiles and Friendships of users."""

from __future__ import annotations

import os
import random
import uuid
from pathlib import Path

from project import settings
from django.db import models
from project.defaults import badges_strings
from userauth.models import SiteUser


def avatar_path(instance: Profile, filename: str) -> str:
    """Construct the path at wich the profile picture will be stored."""
    return f'profile_pics/user_{instance.pk}_profile.png'

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
    
    def __str__(self) -> str:
        """Define how to output the object as string."""
        return f'{self.username} Profile'
    