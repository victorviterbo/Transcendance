"""HTTP views for game management and testing."""

import uuid

from chat.models import Room
from music.models import Playlist, Track
from music.serializers import BlindSerializer
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from game.models import Game


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
		
		# Validate input
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
		
		# Calculate tracks per genre
		tracks_per_genre = num_tracks // len(genres)
		if tracks_per_genre == 0:
			return Response({
				'error': 'Not enough tracks',
				'message': f'num_tracks ({num_tracks}) must be >= number of genres ({len(genres)})'
			}, status=status.HTTP_400_BAD_REQUEST)
		
		# Fetch tracks for each genre
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
		
		# Create a dynamic playlist for this game
		playlist_name = f"Game Playlist - {', '.join(genres)} ({uuid.uuid4()})"
		playlist = Playlist.objects.create(name=playlist_name)
		playlist.tracks.set(all_tracks)
		
		# Create a room for this game
		room_name = f"Game Room - {', '.join(genres)} ({uuid.uuid4()})"
		room = Room.objects.create(
			name=room_name,
			is_direct=False
		)
		
		# Get first track as current
		current_track = all_tracks[0]
		
		# Create the game
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
			'current_track': BlindSerializer(current_track).data,
			'num_tracks': num_tracks,
			'message': 'Game created successfully. Use game_uid to join via WebSocket.'
		}, status=status.HTTP_201_CREATED)
