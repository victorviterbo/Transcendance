"""Define the statistics model."""

from __future__ import annotations

import uuid

from chat.models import Room
from django.db import models
from music.models import Track
from userprofile.models import Profile


class Game(models.Model):
    """Define the model for a single player for a single game."""

    game_name = models.CharField(max_length=50)
    
    players = models.ManyToManyField(Profile,
                                     through='stats.UserGameStats')
    
    tracks = models.ManyToManyField(Track,
                                    through='stats.GameRoundStats')
    
    room = models.OneToOneField(Room,
                                on_delete=models.SET_NULL,
                                null=True)
    
    played_at = models.DateTimeField(auto_now_add=True)

    is_over = models.BooleanField(default=False)

    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    is_public = models.BooleanField(default=False)

    class Meta:
        """Define special behaviour of database."""
        ordering = ['-played_at']
