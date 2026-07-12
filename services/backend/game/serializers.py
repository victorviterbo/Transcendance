"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Game
"""
from typing import Any

from project.defaults import genres, max_players
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


class GameSettingsSerializer(serializers.ModelSerializer):
    """Serializer for updating updating game fields through websocket."""

    class Meta:
        """Meta config for GameSettingsSerializer."""
        model = Game
        fields = [
            'genres',
            'mode',
            'trackCount',
            'playbackDuration',
            'breakDuration',
            'reveal',
            'fuzzy',
        ]

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

    def validate_name(self, value : str)-> Any:
        """Validate that the name is correct."""
        if not value:
            raise serializers.ValidationError(
                f"Invalid name: {value}. Name cannot be empty.",
                code='invalid_name',
            )
        elif len(value) > 40:
            raise serializers.ValidationError(
                f"Invalid name: {value}. \
                    Name must be less than or equal to 40 characters.",
                code='invalid_name',
            )
        return value
class GameDetailSerializer(serializers.ModelSerializer):
    """Full game serializer including player list."""
    players = LightProfileSerializer(source='active_players', many=True, read_only=True)
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
    round = serializers.IntegerField(source='current_round')
    maxPlayers = serializers.IntegerField(default=max_players, read_only=True)
    class Meta:
        """Meta config for GameWSSerializer."""
        model = Game
        fields = [
            'uid',
            'name',
            'owner',
            'status',
            'roomUID',
            'round',
            'genres',
            'visibility',
            'maxPlayers'
        ]
        read_only_fields = fields

