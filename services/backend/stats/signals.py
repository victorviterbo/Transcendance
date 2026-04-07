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
    if instance.is_terminated:
        players = instance.players.all()
        for player in players:
            total_game_xp = UserRoundStats.objects.filter(
                player=player,
                round__game=instance # See the use of __ for join queries
            ).aggregate(total=Sum('xp_earned'))['total'] or 0
            user_profile = player.profile
            if total_game_xp > 0:
                user_profile.exp_points += total_game_xp
                user_profile.badges = get_badge(player.profile.exp_points)
                user_profile.save(update_fields=['exp_points', 'badges'])
