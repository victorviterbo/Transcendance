"""Defines the views relatives to user registration, login, password change etc."""

from typing import Any

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as coreValidationError
from django.db.models import Prefetch
from game.models import Game
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from userprofile.models import Profile

from .models import GameRoundStats, UserGameStats, UserRoundStats
from .serializers import GameHistory


class GameHistoryView(APIView):
    """Define the register page."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Return the serialized game history for display."""
        games = Game.objects.filter(players=request.profile).distinct().prefetch_related(
            Prefetch('stats',
                queryset=UserRoundStats.objects.filter(player=request.profile),
                to_attr='my_stats'
            )
        )
        response_payload = {}
        for game in games:
            round_serializer = GameHistory(game.my_stats, many=True)
            if round_serializer.is_valid():
                response_payload[str(game.uid)] = {'info': game.name,
                                              'stats':round_serializer.data}
        return Response(response_payload, status=status.HTTP_200_OK)
    
class GameHistoryLightView(APIView):
    """Define the register page."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Return the serialized game history for display."""
        games = Game.objects.filter(players=request.profile).distinct().prefetch_related(
            Prefetch('stats',
                queryset=UserRoundStats.objects.filter(player=request.profile),
                to_attr='my_stats'
            )
        )
        response_payload = {}
        for game in games:
            response_payload[str(game.uid)] = {'info': game.game_name,
                                            'stats':GameHistory(game.my_stats,
                                                                many=True)}
        return Response(response_payload, status=status.HTTP_200_OK)