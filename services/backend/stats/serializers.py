"""This module implements the serialization for the stats backend."""

from rest_framework import serializers


class GlobalStatsSerializer(serializers.Serializer):
    averageScore = serializers.FloatField()
    xp = serializers.IntegerField()
    totalGamesPlayed = serializers.IntegerField()
    totalSongsPlayed = serializers.IntegerField()
    totalGamesWon = serializers.IntegerField()
    ranking = serializers.IntegerField()
    totalPlayers = serializers.IntegerField()
    averageTime = serializers.FloatField()
    successRateArtist = serializers.IntegerField()
    successRateSong = serializers.IntegerField()
    successRateComplete = serializers.IntegerField()
    successRatesCompleteByTag = serializers.DictField()

class LeaderboardEntrySerializer(serializers.Serializer):
    username = serializers.CharField()
    avatar = serializers.CharField()
    xp = serializers.IntegerField()
    badges = serializers.ReadOnlyField()
    ranking = serializers.IntegerField()
    isCurrentUser = serializers.BooleanField()


class HistoryPlayerSerializer(serializers.Serializer):
    username = serializers.CharField()
    avatar = serializers.CharField()
    ranking = serializers.IntegerField()


class HistoryRoundSerializer(serializers.Serializer):
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
    playedAt = serializers.DateTimeField()
    xpEarned = serializers.IntegerField()
    ranking = serializers.IntegerField()
    roomTitle = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())
    players = HistoryPlayerSerializer(many=True)
    rounds = HistoryRoundSerializer(many=True)
