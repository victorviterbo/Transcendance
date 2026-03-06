"""Define the Profiles and Friendships of users."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from django.db import models
from PIL import Image
from project.defaults import badges_strings
from userauth.models import SiteUser

def profile_pic_path(instance, filename):
    return f'profile_pics/user_{instance.pk}_profile.png'

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
    
    image = models.ImageField(default='default_pp.jpg',
                              upload_to=profile_pic_path)
    
    exp_points = models.IntegerField(default=0)

    badges = models.CharField(max_length=30,
                              default=badges_strings[0],
                              choices=[(b, b) for b in badges_strings])
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)

    is_guest = models.BooleanField(default=True)

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
    
    """
    def save(self, *args: Any, **kwargs: Any) -> None:
        If username is changed, rename profile picture file to keep consistency.
        if self.pk:
            old_instance = Profile.objects.get(pk=self.pk)
            if old_instance.username != self.username and self.image == old_instance.image:
                old_path = Path(self.image.path)
                if old_path.is_file() and "profile_pics/" in self.image.name:
                    new_name = f"profile_pics/{self.username}_profile.png"
                    new_full_path = old_path.parent / new_name
                    old_path.rename(new_full_path)
                    self.image.name = new_name
        super().save(*args, **kwargs)"""

    """def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        Profile model specific actions when deleting entry.
        if self.image and self.image.name != 'default_pp.jpg':
            image_path = Path(self.image.path)
            if image_path.is_file():
                image_path.unlink(missing_ok=True)
        return super().delete(*args, **kwargs)"""
        