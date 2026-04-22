"""Define automatic actions based on a designated trigger for the stats module."""

from typing import Any

from django.db.models import Sum
from django.db.models.signals import post_save
from django.dispatch import receiver
from project.defaults import get_badge

from .models import GameRoundStats, UserRoundStats


@receiver(post_save, sender=GameRoundStats)
def save_profile(sender: type[GameRoundStats],
                 instance: GameRoundStats,
                 **kwargs: Any) -> None:
    """Trigger updating of profile after updating a user."""
    if instance.game.is_over:
        players = instance.player.all()
        for player in players:
            total_game_xp = UserRoundStats.objects.filter(
                player=player,
                round__game=instance.game # See the use of __ for join queries
            ).aggregate(total=Sum('xp_earned'))['total'] or 0
            if total_game_xp > 0:
                player.exp_points += total_game_xp
                player.badges = get_badge(player.exp_points)
                player.save(update_fields=['exp_points', 'badges'])
