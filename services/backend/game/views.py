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
	GameUpdateSerializer,
)
from .services import setup_game_assets


def _parse_validation_errors(val_error: serializers.ValidationError) -> Response:
	"""Format the validation error structure to match the expected format."""
	error = val_error.get_full_details()
	error_response = {'error': {}}
	for field, details in error.items():
		if not isinstance(details, list) or len(details) == 0:
			continue
		if not isinstance(details[0], dict) or 'code' not in details[0]:
			continue
		error_code = details[0].get('code') if isinstance(details[0], dict) else None
		if not error_code:
			error_response['error'][field] = "UNKNOWN_ERROR"
		elif field == 'non_field_errors':
			error_response['error']['non_field'] = error_code.upper()
		elif (error_code in [	'NOT_ENOUGH_TRACKS',
								'NOT_ENOUGH_TRACKS_GENRE',
								'NO_TRACKS_FOUND']):
			if error_response['error'].get('global'):
				error_response['error']['global'].append(error_code.upper())
			else:
				error_response['error']['global'] = [error_code.upper()]
		elif error_code in ['required',
							'invalid',
							'empty',
							'min_value',
							'max_value',
							'blank',
							'min_length',
							'max_length',
							'not_a_list',
							'invalid_choice']:
			error_response['error'][field] = f"{error_code.upper()}_{field.upper()}"
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
	"""ViewSet for managing games: create, list, retrieve, update, delete."""
	queryset = Game.objects.all()
	permission_classes = [AllowAny]

	def get_serializer_class(self) -> type[serializers.Serializer]:
		"""Return the appropriate serializer based on the action."""
		if self.action == 'create':
			return GameCreationSerializer
		elif self.action in ('partial_update', 'update'):
			return GameUpdateSerializer
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
		"""Disable full update (PUT); allow PATCH (partial_update)."""
		from rest_framework.exceptions import MethodNotAllowed

		if request.method == 'PUT':
			raise MethodNotAllowed('PUT')

		# For PATCH (partial_update) delegate to the normal update logic
		return super().update(request, *args, **kwargs)
		