"""HTTP views for game management and testing."""

from typing import Any

from django.db import transaction
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
				new_game.players.add(request.user.profile)
				new_game.owned_by = request.user.profile
				new_game.save()
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
		