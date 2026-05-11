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

from .models import Game


class GameCreationSerializer(serializers.ModelSerializer):
    """Minimal serializer for creating a Game.

    Only requires `game_name` and `public_level`. Other fields use model
    defaults or are managed server-side.
    """

    class Meta:
        model = Game
        fields = ['game_name', 'public_level']


class GameUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating (PATCH) game fields."""

    class Meta:
        """Meta config for GameUpdateSerializer."""
        model = Game
        fields = [
            'game_name',
            'genres',
            'game_mode',
            'public_level',
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
            'pop',
            'rock',
            'rap',
            'electro',
            'r&b/soul',
            'variété française',
        ]
        if value:
            invalid = [g for g in value if g not in valid_genres]
            if invalid:
                raise serializers.ValidationError(
                    f"Invalid genres: {', '.join(invalid)}.Valid: {', '.join(valid_genres)}",  # noqa: E501
					code='invalid_genres',
                )
        return value


class PlayerSerializer(serializers.Serializer):
    """Serialize player with nested user info and points."""
    user = serializers.SerializerMethodField()
    points = serializers.IntegerField(source='total_xp_earned')

    def get_user(self, obj: UserGameStats) -> dict:
        """Serialize user info with relation to current user."""
        profile = obj.player
        request = self.context.get('request')
        current_user = request.user if request else None

        badge = get_badge(profile.exp_points)
        relation = self._get_relation(profile, current_user)

        return {
            'uid': str(profile.uid),
            'username': profile.username,
            'image': profile.avatar.url if profile.avatar else None,
            'badges': badge,
            'relation': relation,
        }

    def _get_relation(self, profile: Profile, current_user: Any) -> str:
        """Determine if player is self or other."""
        if not current_user or not current_user.is_authenticated:
            return 'other'

        if current_user.profile.id == profile.id:
            return 'self'

        return 'other'


class GameDetailSerializer(serializers.ModelSerializer):
    """Full game serializer including player list."""
    id = serializers.CharField(read_only=True)
    game_name = serializers.CharField(read_only=True)
    genres = serializers.ListField(read_only=True)
    players = PlayerSerializer(source='player_stats', many=True, read_only=True)
    max_players = serializers.SerializerMethodField()
    public_level = serializers.CharField(read_only=True)

    class Meta:
        """Meta config for GameDetailSerializer."""
        model = Game
        fields = [
            'id',
            'game_name',
            'genres',
            'public_level',
            'players',
            'max_players',
        ]

    def get_max_players(self, obj: Game) -> int:
        """Return max players for this game (e.g., num_tracks)."""
        return obj.num_tracks