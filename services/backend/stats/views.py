"""Defines the views for the stats module."""

from django.db.models import Avg, Sum
from music.models import Playlist
from project import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from userprofile.models import Profile

from .models import GameRoundStats, UserGameStats, UserRoundStats
from .serializers import HistoryEntrySerializer, LeaderboardEntrySerializer


def _get_avatar_url(request: Request, profile: Profile) -> str:
    """Return the absolute URL of a profile's avatar."""
    if request.profile.avatar and hasattr(request.profile.avatar, 'url'):
        return request.profile.avatar.url
    else:
        return (settings.STATIC_URL + \
            f"default_avatars/default_avatar_{request.profile.pk % 18}.png")

def _ranking(profile: Profile) -> int:
    """Return the 1-based global ranking of a profile by exp_points."""
    return (
        Profile.objects.filter(is_guest=False, exp_points__gt=profile.exp_points).count() + 1
    )


def _total_players() -> int:
    """Return the total number of registered (non-guest) players."""
    return Profile.objects.filter(is_guest=False).count()


class GlobalStatsView(APIView):
    """Return aggregated statistics for a given user."""
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        """Return aggregated stats for the queried username."""
        query = request.query_params.get('q')
        if not query:
            return Response({'error': {'query': 'MISSING_FIELD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            profile = Profile.objects.get(username=query)
        except Profile.DoesNotExist:
            return Response({'error': {'query': 'USER_NOT_FOUND'}},
                            status=status.HTTP_400_BAD_REQUEST)

        rounds = UserRoundStats.objects.filter(player=profile)
        total_rounds = rounds.count()

        agg = rounds.aggregate(avg_score=Avg('xp_earned'), avg_time=Avg('time'))
        avg_score = round(agg['avg_score'] or 0.0, 2)
        avg_time_duration = agg['avg_time']
        avg_time = round(avg_time_duration.total_seconds(), 2) if avg_time_duration else 0.0

        if total_rounds > 0:
            artist_rate = round(
                rounds.filter(artist_found=True).count() / total_rounds * 100, 2)
            song_rate = round(
                rounds.filter(song_found=True).count() / total_rounds * 100, 2)
            complete_rate = round(
                rounds.filter(artist_found=True, song_found=True).count() / total_rounds * 100, 2)
        else:
            artist_rate = song_rate = complete_rate = 0.0
        tag_rates = {}
        playlists = Playlist.objects.filter(
            tracks__in=rounds.values('track')
        ).distinct()
        for playlist in playlists:
            tag_rounds = rounds.filter(track__playlists=playlist)
            tag_total = tag_rounds.count()
            if tag_total > 0:
                tag_complete = tag_rounds.filter(artist_found=True, song_found=True).count()
                tag_rates[playlist.slug] = round(tag_complete / tag_total * 100, 2)

        return Response({
            'averageScore': avg_score,
            'xp': profile.exp_points,
            'ranking': _ranking(profile),
            'totalPlayers': _total_players(),
            'averageTime': avg_time,
            'successRateArtist': artist_rate,
            'successRateSong': song_rate,
            'successRateComplete': complete_rate,
            'successRatesCompleteByTag': tag_rates,
        }, status=status.HTTP_200_OK)


class LeaderboardView(APIView):
    """Return the top-10 leaderboard and the current user's ranking."""
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        """Return leaderboard data."""
        top_profiles = (
            Profile.objects.filter(is_guest=False)
            .order_by('-exp_points')[:10]
        )
        entries = []
        is_in_top_10 = False
        for rank, profile in enumerate(top_profiles, start=1):
            entries.append({
                'username': profile.username,
                'avatar': _get_avatar_url(request, profile),
                'xp': profile.exp_points,
                'badges': profile.badges,
                'ranking': _ranking(profile),
                'isCurrentUser': profile == request.profile,
            })
            if profile == request.profile:
                is_in_top_10 = True
        
        if not is_in_top_10:
            profile = request.profile
            entries.append({
                'username': profile.username,
                'avatar': _get_avatar_url(request, profile),
                'xp': profile.exp_points,
                'badges': profile.badges,
                'ranking': _ranking(profile),
                'isCurrentUser': True,
            })
        serializer = LeaderboardEntrySerializer(entries, many=True)
        return Response({
            'leaderboard': serializer.data,
            'leaderboardCount': len(entries),
            'totalNumberPlayer': _total_players(),
        }, status=status.HTTP_200_OK)


class HistoryView(APIView):
    """Return the last 10 games played by the authenticated user."""
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        """Return match history."""
        profile = request.profile

        user_game_stats = (
            UserGameStats.objects.filter(player=profile)
            .select_related('game')
            .order_by('-played_at')[:10]
        )

        history = []
        for ugs in user_game_stats:
            game = ugs.game
            game_xp_ranking = list(
                UserRoundStats.objects.filter(game=game)
                .values('player')
                .annotate(total_xp=Sum('xp_earned'))
                .order_by('-total_xp')
            )
            my_xp = next(
                (p['total_xp'] for p in game_xp_ranking if p['player'] == profile.pk), 0
            )
            my_rank = next(
                (i + 1 for i, p in enumerate(game_xp_ranking) if p['player'] == profile.pk), 1
            )
            track_ids = (
                GameRoundStats.objects.filter(game=game)
                .values_list('track_id', flat=True)
            )
            tags = list(
                Playlist.objects.filter(tracks__in=track_ids)
                .values_list('slug', flat=True)
                .distinct()
            )
            players_data = []
            for player_profile in game.players.all():
                p_xp = next(
                    (p['total_xp'] for p in game_xp_ranking if p['player'] == player_profile.pk),
                    0
                )
                p_rank = sum(1 for p in game_xp_ranking if p['total_xp'] > p_xp) + 1
                avatar_url = (
                    request.build_absolute_uri(player_profile.avatar.url)
                    if player_profile.avatar else ''
                )
                players_data.append({
                    'username': player_profile.username,
                    'avatar': avatar_url,
                    'ranking': p_rank,
                })
            rounds_data = []
            user_rounds = (
                UserRoundStats.objects.filter(player=profile, game=game)
                .select_related('round__track')
                .order_by('round__round_number')
            )
            for urs in user_rounds:
                track = urs.round.track if urs.round else None
                round_rank = (
                    UserRoundStats.objects.filter(
                        round=urs.round, xp_earned__gt=urs.xp_earned
                    ).count() + 1
                )
                rounds_data.append({
                    'trackName': track.title if track else '',
                    'trackArtist': track.artist if track else '',
                    'songFound': urs.song_found,
                    'artistFound': urs.artist_found,
                    'time': round(urs.time.total_seconds(), 2),
                    'ranking': round_rank,
                    'previewUrl': track.preview_url if track else None,
                    'artworkUrl': track.artwork_url if track else None,
                    'roundNumber': urs.round.round_number if urs.round else 0,
                })

            history.append({
                'playedAt': ugs.played_at,
                'xpEarned': my_xp,
                'ranking': my_rank,
                'roomTitle': game.game_name,
                'tags': tags,
                'players': players_data,
                'rounds': rounds_data,
            })

        serializer = HistoryEntrySerializer(history, many=True)
        return Response({
            'history': serializer.data,
            'historyCount': len(history),
        }, status=status.HTTP_200_OK)
