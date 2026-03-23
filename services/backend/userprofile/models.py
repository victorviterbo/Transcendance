"""Define the Profiles and Friendships of users."""

from __future__ import annotations

from django.db import models
from project.defaults import badges_strings
from userauth.models import SiteUser


def profile_pic_path(instance: Profile, filename: str) -> str:
    """Construct the path at wich the profile picture will be stored."""
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
    