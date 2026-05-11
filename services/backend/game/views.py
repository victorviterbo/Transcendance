"""HTTP views for game management and testing."""

from typing import Any

from django.db import transaction
from django.db.models import Max, Sum
from rest_framework import serializers, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from stats.models import UserGameStats, UserRoundStats

from game.models import Game

from .serializers import (
	GameCreationSerializer,
	GameDetailSerializer,
)
from .services import format_validation_errors, setup_game_assets


def _parse_validation_errors(val_error: serializers.ValidationError) -> Response:
	"""Format the validation error structure to match the expected format."""
	error_response = format_validation_errors(val_error)
	return Response(error_response, status=status.HTTP_400_BAD_REQUEST)

def _init_game_stats(game: Game) -> None:
	"""Initialize game stats for all players at the start of a game."""
	for player in game.players.all():
		UserGameStats.objects.create(
			game=game,
			player=player,
			is_won=False
		)

def _wrapup_game_stats(game: Game) -> None:
	"""Wrap up game stats for all players at the end of a game."""
	player_scores = (
		UserRoundStats.objects.filter(round__game=game)
		.values('player')
		.annotate(
			total_points=Sum('xp_earned'),
			total_time=Sum('time'))
		.order_by()
	)
	highest_score = player_scores.aggregate(max_score=Max('total_points'))['max_score']
	candidates = list(player_scores.filter(total_points=highest_score))
	if not candidates:
		return
	if len(candidates) == 1:
		winner_id = candidates[0]['player']
	else:
		winner_id = min(candidates, key=lambda x: x['total_time'])['player']
	UserGameStats.objects.filter(game=game, player_id=winner_id).update(is_won=True)
	for player, xp in player_scores.items():
		UserGameStats.objects.filter(game=game, player=player).update(
			total_xp_earned=xp
		)

class GameViewSet(viewsets.ModelViewSet):
	"""ViewSet for managing games: list, retrieve, and create only."""
	queryset = Game.objects.all()
	permission_classes = [AllowAny]
	http_method_names = ['get', 'post', 'head', 'options']

	def get_serializer_class(self) -> type[serializers.Serializer]:
		"""Return the appropriate serializer based on the action."""
		if self.action == 'create':
			return GameCreationSerializer
		return GameDetailSerializer

	def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
		"""Create a game with the provided name and privacy status."""
		try:
			game_serializer = self.get_serializer(data=request.data)
			game_serializer.is_valid(raise_exception=True)
			with transaction.atomic():
				new_game = game_serializer.save()
				setup_game_assets(new_game)
			return Response(
				{'success': True, 'game_id': new_game.id},
				status=status.HTTP_201_CREATED,
			)
		except serializers.ValidationError as e:
			return _parse_validation_errors(e)

	def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
		"""Reject full updates for games."""
		from rest_framework.exceptions import MethodNotAllowed

		raise MethodNotAllowed('PUT')

	def partial_update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
		"""Reject partial updates for games."""
		from rest_framework.exceptions import MethodNotAllowed

		raise MethodNotAllowed('PATCH')

	def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
		"""Reject deletes for games."""
		from rest_framework.exceptions import MethodNotAllowed

		raise MethodNotAllowed('DELETE')
		