"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Game
"""
from typing import Any

from project.defaults import genres
from rest_framework import serializers
from userprofile.serializers import LightProfileSerializer

from .models import Game


class GameCreationSerializer(serializers.ModelSerializer):
    """Minimal serializer for creating a Game.

    Only requires `name` and `visibility`. Other fields use model
    defaults or are managed server-side.
    """

    class Meta:
        """Define which fields are used to generate the game."""
        model = Game
        fields = ['name', 'visibility']


class GameUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating updating game fields through websocket."""

    class Meta:
        """Meta config for GameUpdateSerializer."""
        model = Game
        fields = [
            'uid',
            'genres',
            'game_mode',
            'num_tracks',
            'playback_duration',
            'break_duration',
            'answer_public',
            'fuzzy_match',
        ]
        read_only_fields = ['name']

    def validate_genres(self, value : Any)-> Any:
        """Validate that all genres are in the allowed list."""
        if value:
            invalid = [g for g in value if g not in genres]
            if invalid:
                raise serializers.ValidationError(
                    f"Invalid genres: {', '.join(invalid)}.Valid: {', '.join(genres)}",  # noqa: E501
					code='invalid_genres',
                )
        return value


class GameDetailSerializer(serializers.ModelSerializer):
    """Full game serializer including player list."""
    players = LightProfileSerializer(many=True, read_only=True) # TODO : remove players, playerCount and playerMax instead

    class Meta:
        """Meta config for GameDetailSerializer."""
        model = Game
        fields = [
            'uid',
            'name',
            'genres',
            'players',
        ]
        read_only_fields = ['uid',
                            'name',
                            'genres',
                            'players',
                            ]


class GameHeaderSerializer(serializers.ModelSerializer):
    """Serializer for sending game data over WebSocket."""

    owner = LightProfileSerializer(source='owned_by', read_only=True)
    roomUID = serializers.CharField(source='room__uid', read_only=True)
    players = LightProfileSerializer(many=True, read_only=True)
    round = serializers.IntegerField(source='current_round')
    class Meta:
        """Meta config for GameWSSerializer."""
        model = Game
        fields = [
            'uid',
            'name',
            'players',
            'owner',
            'status',
            'roomUID',
            'round',
            'genres',
            'visibility',
        ]
        read_only_fields = fields

