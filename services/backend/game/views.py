"""HTTP views for game management and testing."""

import uuid

from chat.models import Room
from django.db.models import Max, Sum
from music.models import Playlist, Track
from music.serializers import BlindSerializer
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from stats.models import GameRoundStats, UserGameStats, UserRoundStats

from game.models import Game


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

class GameView(APIView):
	"""Create a game with tracks from selected genres."""
	permission_classes = [AllowAny]

	def post(self, request: Request) -> Response:
		"""Create a game with tracks from specified genres.
        
		Request body:
		{
		    "genres": ["rock", "pop"],
		    "num_tracks": 10
		}
        
		Returns:
		    - game_uid: UUID of the created game
		    - playlist: Playlist name with genres
		    - current_track: Current track preview URL
		    - num_tracks: Total tracks selected
		"""
		genres = request.data.get('genres', [])
		num_tracks = request.data.get('num_tracks')
		if not genres or not isinstance(genres, list):
			return Response({
				'error': 'Invalid genres',
				'message': 'Genres must be a non-empty list'
			}, status=status.HTTP_400_BAD_REQUEST)
		
		if not num_tracks or not isinstance(num_tracks, int) or num_tracks <= 0:
			return Response({
				'error': 'Invalid num_tracks',
				'message': 'num_tracks must be a positive integer'
			}, status=status.HTTP_400_BAD_REQUEST)
		tracks_per_genre = num_tracks // len(genres)
		if tracks_per_genre == 0:
			return Response({
				'error': 'Not enough tracks',
				'message': f'num_tracks ({num_tracks}) must be >= number of genres ({len(genres)})'
			}, status=status.HTTP_400_BAD_REQUEST)
		all_tracks = []
		for genre in genres:
			genre_tracks = Track.objects.filter(genre=genre).order_by('?')[:tracks_per_genre]
			
			if len(genre_tracks) < tracks_per_genre:
				return Response({
					'error': f'Not enough tracks for genre: {genre}',
					'message': f'Found {len(genre_tracks)} tracks, but need {tracks_per_genre}'
				}, status=status.HTTP_400_BAD_REQUEST)
			
			all_tracks.extend(genre_tracks)
		
		if not all_tracks:
			return Response({
				'error': 'No tracks found',
				'message': 'No tracks available for the selected genres'
			}, status=status.HTTP_400_BAD_REQUEST)
		playlist_name = f"Game Playlist - {', '.join(genres)} ({uuid.uuid4()})"
		playlist = Playlist.objects.create(name=playlist_name)
		playlist.tracks.set(all_tracks)
		room_name = f"Game Room - {', '.join(genres)} ({uuid.uuid4()})"
		room = Room.objects.create(
			name=room_name,
			is_direct=False
		)
		current_track = all_tracks[0]
		game = Game.objects.create(
			room=room,
			game_name=playlist_name,
			playlist=playlist,
			status='waiting',
			current_round=1,
			current_track=current_track,
			max_rounds=num_tracks,
		)
		
		return Response({
			'game_uid': str(game.uid),
			'playlist': {
				'name': playlist.name,
				'id': playlist.id,
			},
			'current_track': BlindSerializer(current_track).data, #Remove line and put in gameplay loop instead of initialization ?
			'num_tracks': num_tracks,
			'message': 'Game created successfully. Use game_uid to join via WebSocket.'
		}, status=status.HTTP_201_CREATED)
