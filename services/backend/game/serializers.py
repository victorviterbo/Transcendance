"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Game
"""
from rest_framework import serializers

from .models import Game


class GameSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's friendship requests."""
    
    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Game
        fields = ['game_name',
                  'players',
                  'tracks',
                  'room',
                  'played_at',
                  'is_over',
                  'uid']
