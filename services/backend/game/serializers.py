"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Game
"""
from datetime import timedelta

from music.serializers import PlaylistMiniSerializer
from project.defaults import num_genres
from rest_framework import serializers

from .models import Game


class GameCreationSerializer(serializers.ModelSerializer):
    """Set how to serialize game creation request."""
    
    num_tracks = serializers.IntegerField(source='num_tracks',
                                         write_only=True,
                                         required=True,
                                         min_value=1,
                                         max_value=100
                                         )
    
    playback_duration = serializers.DurationField(source='playback_duration',
                                                 write_only=True,
                                                 required=True,
                                                 min_value=timedelta(seconds=5),
                                                 max_value=timedelta(seconds=30)
                                                 )
    


    genres = serializers.ListField(
        child=serializers.CharField(),
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

    def validate(self, data: dict) -> dict:
        """Perform cross-field validation for game creation."""
        if 'genres' in data and 'num_tracks' in data:
            genres = data['genres']
            num_tracks = data['num_tracks']
            if num_tracks < len(genres):
                raise serializers.ValidationError('Not enough tracks',
                                                  code='NOT_ENOUGH_TRACKS')
        return super().validate(data)
    

class GameSendSerializer(serializers.ModelSerializer):
    """Set how to serialize a game for sending to clients."""

    playlist = PlaylistMiniSerializer(read_only=True)
    
    class Meta:
        """Defines the metaclass for the GameSendSerializer.
        
        This part tells the rest_framework serializer how to contruct the
        GameSendSerializer class itself
        """
        model = Game
        fields = ['game_uid',
                  'playlist',
                  'num_tracks',
                ]