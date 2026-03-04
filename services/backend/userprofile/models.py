"""Define the Profiles and Friendships of users."""

from __future__ import annotations

from typing import Any

from django.db import models
from PIL import Image
from project.defaults import badges_strings, get_badge
from userauth.models import SiteUser


class Profile(models.Model):
    """Define the structure of the Profile, based on a generic model."""
    user = models.OneToOneField(SiteUser,
                                on_delete=models.CASCADE,
                                null=True, # if anonymous user (not logged in)
                                blank=True
                                )
    username = models.CharField(max_length=20, default="Anonymous", unique=True)
    image = models.ImageField(default='default_pp.jpg', upload_to='profile_pics')
    exp_points = models.IntegerField(default=0)
    badges = models.CharField(max_length=30,
                              default=badges_strings[0],
                              choices=[(b, b) for b in badges_strings])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Enforce uniqueness only the name is not Anonymous."""
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
    
    def save(self, *args: Any, **kwargs: Any) -> None:
        """Define how to save the object.

        Args:
            self: the Profile to be returned
            args: additional arguments that might be needed by the parent class
            kwargs: additional arguments that might be needed by the parent class
        """
        super().save(*args, **kwargs)
        img = Image.open(self.image.path)
        if img.height > 300 or img.width > 300:
            output_size = (300, 300)
            img.thumbnail(output_size)
            img.save(self.image.path)
