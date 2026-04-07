"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa
"""

from music.serializers import TrackSerializer
from rest_framework import serializers

from .models import GameRoundStats, UserGameStats, UserRoundStats


class GameHistory(serializers.ModelSerializer):
    """Set how to serialize a user (user obj <-> JSON)."""

    track = serializers.TrackSerializer()
    round_number = serializers.IntegerField(source='round.round_numer')
    class Meta:
        """Defines the game match history serializer."""
        model = UserRoundStats
        fields = ['track', 'round_number', 'track', 'is_won', 'time', 'xp_earned', 'played-at']
