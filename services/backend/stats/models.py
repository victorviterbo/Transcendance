"""Define the statistics model."""

from __future__ import annotations

from datetime import timedelta

from django.db import models
from game.models import Game
from music.models import Track


class GameRoundStats(models.Model):
    """Define the model for a single player for a single game."""

    round_number = models.PositiveIntegerField()
    game = models.ForeignKey(Game,
                             on_delete=models.CASCADE)
    winner = models.ForeignKey('userprofile.Profile',
                               on_delete=models.SET_NULL,
                               null=True,
                               related_name='won_rounds')
    track = models.ForeignKey(Track,
                              on_delete=models.SET_NULL,
                              null=True)
    player = models.ManyToManyField('userprofile.Profile',
                               through='UserRoundStats',
                               related_name='played_rounds')
    class Meta:
        """Define the ordering of the game round statistics in the DB."""
        ordering = ['round_number']


class UserRoundStats(models.Model):
    """Specific stats for ONE player in ONE specific round."""
    game = models.ForeignKey(Game,
                             on_delete=models.CASCADE,
                               related_name='stats')
    player = models.ForeignKey('userprofile.Profile',
                               on_delete=models.CASCADE)
    round = models.ForeignKey(GameRoundStats, on_delete=models.CASCADE)
    track = models.ForeignKey(Track,
                              on_delete=models.SET_NULL,
                              null=True)
    is_won = models.BooleanField(default=False)
    time = models.DurationField(default=timedelta(seconds=30))
    xp_earned = models.IntegerField(default=0)
    played_at = models.DateTimeField(auto_now_add=True)

class UserGameStats(models.Model):
    """Define the model for a single player for a single game."""

    game = models.ForeignKey(Game,
                             on_delete=models.CASCADE,
                             related_name='player_stats')
    player = models.ForeignKey('userprofile.Profile',
                               on_delete=models.CASCADE,
                               related_name='games_played')
    played_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        """Define special behaviour of database."""
        ordering = ['-played_at']
