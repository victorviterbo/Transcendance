"""Define the statistics model."""

from __future__ import annotations

from django.db import models
from django.db.models import Sum
from django.utils.functional import cached_property
from game.models import Game
from music.models import Track


class GameRoundStats(models.Model):
    """Define the model for a single player for a single game."""

    round_number = models.PositiveIntegerField()
    game = models.ForeignKey(Game,
                             on_delete=models.CASCADE)
    track = models.ForeignKey(Track,
                              on_delete=models.SET_NULL,
                              null=True)
    players = models.ManyToManyField('userprofile.Profile',
                               through='UserRoundStats',
                               related_name='played_rounds')
    class Meta:
        """Define the ordering of the game round statistics in the DB."""
        ordering = ['round_number']


class UserRoundStats(models.Model):
    """Specific stats for ONE player in ONE specific round."""
    game_stats = models.ForeignKey('UserGameStats',
                                   on_delete=models.CASCADE,
                                   related_name='round_stats',
                                   null=True
    )
    round = models.ForeignKey(GameRoundStats, on_delete=models.CASCADE)
    player = models.ForeignKey('userprofile.Profile',
                               on_delete=models.CASCADE)
    time = models.FloatField(default=30)
    artist_found = models.BooleanField(default=False)
    title_found = models.BooleanField(default=False)
    artist_found_at = models.FloatField(default=-1)
    title_found_at = models.FloatField(default=-1)
    xp_earned = models.PositiveIntegerField(default=0)
    ranking = models.PositiveIntegerField(default=1)
    played_at = models.DateTimeField(auto_now_add=True)

    @cached_property
    def track(self) -> Track:
        """Get the track associated with this round."""
        return self.round.track

    @cached_property
    def game(self) -> Game:
        """Get the game associated with this round."""
        return self.round.game

    def save(self, *args: tuple, **kwargs: dict) -> None:
        """Update time to be the max of found times."""
        self.time = max(self.title_found_at, self.artist_found_at)
        super().save(*args, **kwargs)

class UserGameStats(models.Model):
    """Define the model for a single player in a single game."""

    game = models.ForeignKey(Game,
                             on_delete=models.CASCADE,
                             related_name='player_stats')
    player = models.ForeignKey('userprofile.Profile',
                               on_delete=models.CASCADE,
                               related_name='round_played')
    is_won = models.BooleanField(default=False)
    played_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    @property
    def total_xp_earned(self) -> int:
        """Dynamically sum XP from all rounds played by this player in this game."""
        result = UserRoundStats.objects.filter(
            round__game=self.game,
            player=self.player
        ).aggregate(total=Sum('xp_earned'))    
        return result['total'] or 0
    
    class Meta:
        """Define special behaviour of database."""
        ordering = ['-played_at']
        unique_together = ('game', 'player')
