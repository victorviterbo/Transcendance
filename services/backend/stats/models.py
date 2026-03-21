"""Define the statistics model."""

from __future__ import annotations

from datetime import timedelta

from django.db import models
from game.models import Game
from music.models import Track
from userprofile.models import Profile


class GameRoundStats(models.Model):
    """Define the model for a single player for a single game."""

    round_number = models.PositiveIntegerField()
    winner = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True)
    track = models.ForeignKey(Track, on_delete=models.SET_NULL)
    class Meta:
        """Define the ordering of the game round statistics in the DB."""
        ordering = ['round_number']

class UserGameStats(models.Model):
    """Define the model for a single player for a single game."""

    game = models.ForeignKey(Game, on_delete=models.SET_NULL)
    player = models.ForeignKey(Profile,
                               on_delete=models.CASCADE,
                               related_name='games_played')
    played_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        """Define special behaviour of database."""
        ordering = ['-played_at']

class UserRoundStats(models.Model):
    """Specific stats for ONE player in ONE specific round."""
    player = models.ForeignKey(Profile, through=UserGameStats,
                               on_delete=models.CASCADE)
    round = models.ForeignKey(GameRoundStats,
                              on_delete=models.CASCADE)
    is_won = models.BooleanField(default=False)
    time = models.DurationField(default=timedelta(seconds=30))
    xp_earned = models.IntegerField(default=0)
    played_at = models.DateTimeField(auto_now_add=True)
