"""This module implements the serialization for the stats backend."""

from rest_framework import serializers


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serialize a single leaderboard entry."""
    username = serializers.CharField()
    avatar = serializers.CharField()
    xp = serializers.IntegerField()
    badges = serializers.CharField()
    ranking = serializers.IntegerField()
    isCurrentUser = serializers.BooleanField()


class HistoryPlayerSerializer(serializers.Serializer):
    """Serialize a player summary inside a match history entry."""
    username = serializers.CharField()
    avatar = serializers.CharField()
    ranking = serializers.IntegerField()

class HistoryRoundSerializer(serializers.Serializer):
    """Serialize a single round result inside a match history entry."""
    trackName = serializers.CharField()
    trackArtist = serializers.CharField()
    songFound = serializers.BooleanField()
    artistFound = serializers.BooleanField()
    time = serializers.FloatField()
    ranking = serializers.IntegerField()
    previewUrl = serializers.CharField(allow_null=True)
    artworkUrl = serializers.CharField(allow_null=True)
    roundNumber = serializers.IntegerField()


class HistoryEntrySerializer(serializers.Serializer):
    """Serialize a single game entry inside match history."""
    playedAt = serializers.DateTimeField()
    xpEarned = serializers.IntegerField()
    ranking = serializers.IntegerField()
    roomTitle = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())
    players = HistoryPlayerSerializer(many=True)
    rounds = HistoryRoundSerializer(many=True)
