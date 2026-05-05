"""HTTP views for game management and testing."""

import random
import uuid

from chat.models import Room
from django.db.models import Max, Sum
from django.shortcuts import get_object_or_404
from music.models import Playlist, Track
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from stats.models import UserGameStats, UserRoundStats

from game.models import Game

from .serializers import (
	GameCreationSerializer,
	GameDetailSerializer,
)


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

class GameCreateView(APIView):
	"""Create a game with a name and a privacy status."""
	permission_classes = [AllowAny]

	def post(self, request: Request) -> Response:
		"""Create a game with the provided name and privacy status."""
		try:
			game_serializer = GameCreationSerializer(data=request.data)
			if game_serializer.is_valid(raise_exception=True):
				new_game = game_serializer.save()

			# Allow lightweight game creation. TODO: might delete the other options later
			if not new_game.genres:
				return Response({'success': True, 'game_id': new_game.id}, status=status.HTTP_201_CREATED)

			tracks_per_genre = new_game.num_tracks // len(new_game.genres)
			all_tracks = list()
			for genre in new_game.genres:
				genre_tracks = Track.objects.filter(genre__iexact=genre) \
					.order_by('?')[:tracks_per_genre]
				if len(genre_tracks) < tracks_per_genre:
					raise serializers.ValidationError(
						'Not enough tracks for genre: ' + genre,
						code='NOT_ENOUGH_TRACKS_GENRE')
				all_tracks.extend(genre_tracks)
			if not all_tracks:
				raise serializers.ValidationError(
					'No tracks available for the selected genres',
					code='NO_TRACKS_FOUND')
			# shuffle in-place
			random.shuffle(all_tracks)
			playlist_uid = uuid.uuid4()
			genre_str = ', '.join(new_game.genres)
			playlist_name = f"Game Playlist - {genre_str} ({playlist_uid})"
			playlist = Playlist.objects.create(
				name=playlist_name,
				uid=playlist_uid,
			)
			playlist.tracks.set(all_tracks)
			#create room
			room_uid = uuid.uuid4()
			room_name = f"Game Room - {', '.join(new_game.genres)} ({room_uid})"
			room = Room.objects.create(
				name=room_name,
				is_direct=False,
				uid=room_uid
			)
			new_game.playlist = playlist
			new_game.current_track = all_tracks[0]
			new_game.room = room
			new_game.save()
			
			return Response({'success': True, 'game_id': new_game.id}, status=status.HTTP_201_CREATED)
		except serializers.ValidationError as e:
			return _parse_validation_errors(e)


class GameAccessView(APIView):
	"""Retrieve one game by its database id."""
	permission_classes = [AllowAny]

	def get(self, request: Request, game_id: int) -> Response:
		"""Return game data for the provided id."""
		game = get_object_or_404(Game, id=game_id)
		serializer = GameDetailSerializer(
			game, context={'request': request}
		)
		return Response(
			{'game': serializer.data},
			status=status.HTTP_200_OK
		)
		