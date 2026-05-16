"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Game
"""
from datetime import timedelta
from typing import Any

from music.models import Track
from project.defaults import get_badge, num_genres
from rest_framework import serializers
from stats.models import UserGameStats
from userprofile.models import Profile
from userprofile.serializers import LightProfileSerializer

from .models import Game


class GameCreationSerializer(serializers.ModelSerializer):
    """Minimal serializer for creating a Game.

    Only requires `game_name` and `public_level`. Other fields use model
    defaults or are managed server-side.
    """

    class Meta:
        """Define which fields are used to generate the game."""
        model = Game
        fields = ['game_name', 'public_level']


class GameUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating (PATCH) game fields."""

    class Meta:
        """Meta config for GameUpdateSerializer."""
        model = Game
        fields = [
            'genres',
            'game_mode',
            'num_tracks',
            'break_duration',
            'playback_duration',
            'fuzzy_match',
            'answer_public',
        ]
        read_only_fields = ['game_name']

    def validate_genres(self, value : Any)-> Any:
        """Validate that all genres are in the allowed list."""
        valid_genres: list[str] = [
            'Pop',
            'Rock',
            'Rap',
            'Electro',
            'RNB',
            'French Variety',
        ]
        if value:
            invalid = [g for g in value if g not in valid_genres]
            if invalid:
                raise serializers.ValidationError(
                    f"Invalid genres: {', '.join(invalid)}.Valid: {', '.join(valid_genres)}",  # noqa: E501
					code='invalid_genres',
                )
        return value


class GameHeaderSerializer(serializers.ModelSerializer):
    """Serializer for sending game data over WebSocket."""

    owner = LightProfileSerializer(source='owned_by', read_only=True)
    roomUID = serializers.CharField(source='room__uid', read_only=True)
    players = LightProfileSerializer(source='players', many=True, read_only=True)
    round = serializers.IntegerField(source='current_round')
    class Meta:
        """Meta config for GameWSSerializer."""
        model = Game
        fields = [
            'uid',
            'game_name',
            'players',
            'owner',
            'status',
            'roomUID',
            'round',
        ]
        read_only_fields = fields


class GameDetailSerializer(serializers.ModelSerializer):
    """Full game serializer including player list."""
    players = LightProfileSerializer(source='player_stats', many=True, read_only=True)

    class Meta:
        """Meta config for GameDetailSerializer."""
        model = Game
        fields = [
            'uid',
            'game_name',
            'genres',
            'public_level',
            'players',
        ]
        read_only_fields = ['uid',
                            'game_name',
                            'genres',
                            'public_level',
                            'players',
                            ]
