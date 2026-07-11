"""This module implements the serialization for the stats backend."""

from game.models import Game
from music.serializers import TrackSerializer
from rest_framework import serializers
from userprofile.serializers import LightProfileSerializer

from stats.models import UserGameStats, UserRoundStats


class GlobalStatsSerializer(serializers.Serializer):
    """Serialize the global stats for Profile page."""
    averageScore = serializers.FloatField()
    xp = serializers.IntegerField()
    totalGamesPlayed = serializers.IntegerField()
    totalTitlesPlayed = serializers.IntegerField()
    totalGamesWon = serializers.IntegerField()
    ranking = serializers.IntegerField()
    totalPlayers = serializers.IntegerField()
    averageTime = serializers.FloatField()
    successRateArtist = serializers.FloatField()
    successRateTitle = serializers.FloatField()
    successRateComplete = serializers.FloatField()
    successRatesCompleteByTag = serializers.DictField()

class LeaderboardEntrySerializer(serializers.Serializer):
    """Serialize a single entry of the Leaderboard."""
    username = serializers.CharField()
    avatar = serializers.CharField()
    xp = serializers.IntegerField()
    badges = serializers.ReadOnlyField()
    ranking = serializers.IntegerField()
    isCurrentUser = serializers.BooleanField()


class HistoryPlayerSerializer(serializers.Serializer):
    """Serialize a single player to be displayed in the game history."""
    username = serializers.CharField()
    avatar = serializers.CharField()
    ranking = serializers.IntegerField()
    isGuest = serializers.BooleanField()


class HistoryRoundSerializer(serializers.Serializer):
    """Serialize a single round to be displayed in the game history."""
    trackName = serializers.CharField()
    trackArtist = serializers.CharField()
    titleFound = serializers.BooleanField()
    artistFound = serializers.BooleanField()
    time = serializers.FloatField(read_only=True)
    ranking = serializers.IntegerField()
    previewUrl = serializers.CharField(allow_null=True)
    artworkUrl = serializers.CharField(allow_null=True)
    roundNumber = serializers.IntegerField()


class HistoryEntrySerializer(serializers.Serializer):
    """Serialize the history, using the round and player serializers above,."""
    playedAt = serializers.DateTimeField()
    xpEarned = serializers.IntegerField()
    ranking = serializers.IntegerField()
    roomTitle = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())
    players = HistoryPlayerSerializer(many=True)
    rounds = HistoryRoundSerializer(many=True)


class LiveRoundSerializer(serializers.ModelSerializer):
    """Serialize the results of the round to be sent as the game progress."""
    player = LightProfileSerializer()
    artistFound = serializers.BooleanField(source='artist_found')
    titleFound = serializers.BooleanField(source='title_found')
    points = serializers.IntegerField(source='xp_earned')
    ranking = serializers.IntegerField(required=False, allow_null=True, default=1)

    class Meta:
        """Define on what is the model based."""
        model = UserRoundStats
        fields = [
                'player',
                'artistFound',
                'titleFound',
                'time',
                'points',
                'ranking',
                ]
        read_only_fields = [
                'player',
                'artistFound',
                'titleFound',
                'time',
                'points',
                'ranking',
                ]

class LiveGameSerializer(serializers.ModelSerializer):
    """Serialize all the rounds as a list for end-of-game summary."""
    rounds = LiveRoundSerializer(source='player_stats', many=True, read_only=True)
    uid = serializers.CharField(source='game.uid')
    name = serializers.CharField(source='game.name')

    class Meta:
        """Define the fields in the game stats serializer."""
        model = UserGameStats
        fields = ['uid', 'name', 'rounds']


class GameLeaderboardSerializer(serializers.ModelSerializer):
    """Serialize a single leaderboard entry for in-game use."""
    player = LightProfileSerializer()
    points = serializers.IntegerField(source='total_xp_earned')

    class Meta:
        model = UserGameStats
        fields = ['player', 'points']


class GameHistorySerializer(serializers.ModelSerializer):
    """Serialize a single history entry for in-game use."""
    track = TrackSerializer(source='round.track', read_only=True)
    titleFound = serializers.BooleanField(source='title_found')
    artistFound = serializers.BooleanField(source='artist_found')
    points = serializers.IntegerField(source='xp_earned')
    round = serializers.IntegerField(source='round.round_number')

    class Meta:
        """"Define the fields in the game history serializer."""
        model = UserRoundStats
        fields = [
            'track',
            'titleFound',
            'artistFound',
            'time',
            'ranking',
            'points',
            'round',
        ]
