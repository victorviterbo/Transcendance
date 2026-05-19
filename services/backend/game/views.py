"""HTTP views for game management and testing."""

import uuid

from django.shortcuts import get_object_or_404
from friends.models import Friendship
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from stats.models import UserGameStats

from game.models import Game

from .serializers import (
	GameCreationSerializer,
	GameDetailSerializer,
)
from .services import format_validation_errors


class GeneralGameView(APIView):
	"""Define Creation and listing of games."""
	permission_classes = [AllowAny]

	def get(self, request: Request) -> Response:
		"""Handles the listing of all games."""
		all_public_games = Game.objects.filter(public_level='public')
		serialized_games = GameDetailSerializer(all_public_games, many=True)
		return Response(serialized_games.data, status=status.HTTP_200_OK)
		
	def post(self, request: Request) -> Response:
		"""Handle the creation of a new game."""
		if not getattr(request, 'profile', None):
			return Response({'error': {'profile': 'PROFILE_NOT_FOUND'}},
							status=status.HTTP_400_BAD_REQUEST)
		try:
			new_game_serializer = GameCreationSerializer(data=request.data)
			new_game_serializer.is_valid(raise_exception=True)
			new_game = new_game_serializer.save(owned_by=request.profile)
			UserGameStats.objects.create(game=new_game, player=request.profile)
			serialized_game = GameDetailSerializer(new_game)
			return Response(serialized_game.data, status=status.HTTP_201_CREATED)
		except serializers.ValidationError as e:
			return Response(format_validation_errors(e),
							status=status.HTTP_400_BAD_REQUEST)
	
class FriendsGameView(APIView):
	"""Handle the listing of game."""
	permission_classes = [IsAuthenticated]

	def get(self, request: Request) -> Response:
		"""Handles the listing of games owned by friends."""
		from_ids = Friendship.objects.filter(
			from_user=request.user, status='accepted'
		).values_list('to_user_id', flat=True)
		to_ids = Friendship.objects.filter(
			to_user=request.user, status='accepted'
		).values_list('from_user_id', flat=True)
		friends_games = Game.objects.filter(public_level='friends_only',
											owned_by__user_id__in=from_ids.union(to_ids))
		serialized_games = GameDetailSerializer(friends_games, many=True)
		return Response(serialized_games.data, status=status.HTTP_200_OK)


class SingleGameView(APIView):
	"""Handle the interactions with a specific game."""
	permission_classes = [AllowAny]

	def get(self, request: Request, uid: uuid.UUID) -> Response:
		"""Get information on one specific game."""
		queried_game = get_object_or_404(Game, uid=uid)
		serialized_queried_game = GameDetailSerializer(queried_game)
		return Response(serialized_queried_game.data,
						status=status.HTTP_200_OK)
	
	def patch(self, request: Request, uid: uuid.UUID) -> Response:
		"""Change the game setting on one specific game."""
		queried_game = get_object_or_404(Game, uid=uid)
		if queried_game.status != 'waiting':
			return Response({'error': {'status': 'GAME_ALREADY_STARTED'}},
							status=status.HTTP_400_BAD_REQUEST)
		return Response({}, status=status.HTTP_200_OK)
	
	def delete(self, request: Request, uid: uuid.UUID) -> Response:
		"""Change the game setting on one specific game."""
		queried_game = get_object_or_404(Game, uid=uid)
		queried_game.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)
	