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
    totalSongsPlayed = serializers.IntegerField()
    totalGamesWon = serializers.IntegerField()
    ranking = serializers.IntegerField()
    totalPlayers = serializers.IntegerField()
    averageTime = serializers.FloatField()
    successRateArtist = serializers.FloatField()
    successRateSong = serializers.FloatField()
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


class HistoryRoundSerializer(serializers.Serializer):
    """Serialize a single round to be displayed in the game history."""
    trackName = serializers.CharField()
    trackArtist = serializers.CharField()
    songFound = serializers.BooleanField()
    artistFound = serializers.BooleanField()
    time = serializers.FloatField(read_only=True) #TODO : do we keep this like that or switch to song_found_at and artist_found_at
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
    track = TrackSerializer(source='round.track', read_only=True)
    player = LightProfileSerializer(source='player')
    totalGameXp = serializers.SerializerMethodField()
    class Meta:
        """Define on what is the model based."""
        model = UserRoundStats
        fields = [
                'player',
                'track',
                'artist_found',
                'song_found',
                'artist_found_at',
                'song_found_at',
                'time',
                'xp_earned',
                'totalGameXp',
                ]
        read_only_fields = [
                'player',
                'track',
                'artist_found',
                'song_found',
                'artist_found_at',
                'song_found_at',
                'time',
                'xp_earned',
                'totalGameXp',
                ]
    
    def get_totalXpEarned(self, obj: UserRoundStats) -> int:
        """Get total number of points earned in the game as of now."""
        stats = UserGameStats.objects.filter(game=obj.game, player=obj.player).first()
        return stats.total_xp_earned if stats else 0

class LiveGameSerializer(serializers.ModelSerializer):
    """Serialize all the rounds as a list for end-of-game summary."""
    rounds = LiveRoundSerializer(source='player_stats', many=True, read_only=True)

    class Meta:
        """Define the fields in the game stats serializer."""
        model = Game
        fields = ['uid', 'game_name', 'rounds']