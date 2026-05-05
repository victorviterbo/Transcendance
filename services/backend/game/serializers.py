"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Game
"""
from datetime import timedelta
from typing import Any

from project.defaults import get_badge, num_genres
from rest_framework import serializers
from stats.models import UserGameStats
from userprofile.models import Profile

from .models import Game


class GameCreationSerializer(serializers.ModelSerializer):
    """Set how to serialize game creation request."""
    
    num_tracks = serializers.IntegerField(write_only=True,
                                         required=False,
                                         min_value=1,
                                         max_value=100
                                         )
    
    playback_duration = serializers.DurationField(write_only=True,
                                                 required=False,
                                                 min_value=timedelta(seconds=5),
                                                 max_value=timedelta(seconds=30)
                                                 )
    
    genres = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        min_length=1,
        max_length=num_genres
        )
    
    class Meta:
        """Defines the metaclass for the GameCreationSerializer.
        
        This part tells the rest_framework serializer how to contruct the
        GameCreationSerializer class itself
        """
        model = Game
        fields = ['game_name',
                  'genres',
                  'game_mode',
                  'public_level',
                  'num_tracks',
                  'break_duration',
                  'playback_duration',
                  'fuzzy_match',
                  'answer_public',
                  ]
        extra_kwargs = {
            'game_name': {'required': True},
            'public_level': {'required': True},
            'game_mode': {'required': False},
            'break_duration': {'required': False},
            'fuzzy_match': {'required': False},
            'answer_public': {'required': False},
        }

    def validate(self, data: dict) -> dict:
        """Perform cross-field validation for game creation."""
        genres = data.get('genres')
        if genres:
            num_field = Game._meta.get_field('num_tracks')
            num_tracks = data.get('num_tracks', num_field.default)
            if num_tracks < len(genres):
                raise serializers.ValidationError('Not enough tracks',
                                                  code='NOT_ENOUGH_TRACKS')
        return super().validate(data)


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

    def _get_relation(
        self, profile: Profile, current_user: Any
    ) -> str:
        """Determine if player is self or other."""
        if not current_user or not current_user.is_authenticated:
            return 'other'

        if current_user.profile.id == profile.id:
            return 'self'

        return 'other'


class GameDetailSerializer(serializers.ModelSerializer):
    """Full game serializer including player list."""
    id = serializers.CharField(source='uid', read_only=True)
    players = PlayerSerializer(
        source='player_stats', many=True, read_only=True
    )
    max_players = serializers.SerializerMethodField()

    class Meta:
        """Meta config for GameDetailSerializer."""
        model = Game
        fields = [
            'id',
            'players',
            'max_players',
        ]

    def get_max_players(self, obj: Game) -> int:
        """Return max players for this game (e.g., num_tracks)."""
        return obj.num_tracks