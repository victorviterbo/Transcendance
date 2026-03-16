"""Define the statistics model."""
from __future__ import annotations

from django.db import models
from userprofile.models import Profile


class GameStat(models.Model):
    """Define the model for a single player for a single game."""

    played_at = models.DateTimeField(auto_now_add=True)
    players = models.ManyToManyField(Profile, related_name='games_played')
    is_over = models.BooleanField(default=False)
    test = models.CharField(max_length=10)
    class Meta:
        """Define special behaviour of database."""
        ordering = ['-played_at']

class GameRoundStat(models.Model):
    """Define the model for a single player for a single game."""

    game = models.ForeignKey(GameStat, on_delete=models.CASCADE, related_name='rounds')
    round_number = models.PositiveIntegerField()
    winner = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True)
    class Meta:
        """Define the ordering of the game round statistics in the DB."""
        ordering = ['round_number']


class UserRoundStat(models.Model):
    """Specific stats for ONE player in ONE specific round."""
    player = models.ForeignKey(Profile, on_delete=models.CASCADE)
    round = models.ForeignKey(GameRoundStat,
                              on_delete=models.CASCADE,
                              related_name='performances')
    
    is_won = models.BooleanField(default=False)
    time = models.DurationField()
    #track = models.ForeignKey(Track, on_delete=models.SET_NULL)
    xp_earned = models.IntegerField(default=0)
    played_at = models.DateTimeField(auto_now_add=True)
