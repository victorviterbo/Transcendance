"""HTTP views for game management and testing."""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import Room
from game.models import Game
from music.models import Playlist
from music.serializers import BlindSerializer


class GameTestView(APIView):
	"""Create a test game with real music data for WebSocket testing."""
	permission_classes = [AllowAny]

	def post(self, request: Request) -> Response:
		"""Create a test game with real iTunes tracks.
		
		Returns:
			- game_uid: UUID of the created game
			- playlist: Playlist name
			- current_track: Current track preview URL
		"""
		# Delete any existing test room to ensure fresh start
		Room.objects.filter(name='test_game_room').delete()
		
		# Create a new test room
		room = Room.objects.create(
			name='test_game_room',
			is_direct=False
		)

		# Get first available playlist with tracks
		playlist = Playlist.objects.filter(tracks__isnull=False).distinct().first()
		
		if not playlist:
			return Response({
				'error': 'No playlists with tracks found',
				'message': 'Please seed your database with music first using: python manage.py seed_playlists'
			}, status=status.HTTP_400_BAD_REQUEST)

		# Get random track from playlist
		current_track = playlist.tracks.order_by('?').first()
		
		if not current_track:
			return Response({
				'error': 'Selected playlist has no tracks',
				'message': 'Please add tracks to your playlist'
			}, status=status.HTTP_400_BAD_REQUEST)

		# Create a new test game
		game = Game.objects.create(
			room=room,
			game_name='Test Game',
			playlist=playlist,
			status='waiting',
			current_round=1,
			current_track=current_track,
			max_rounds=5,
		)

		return Response({
			'game_uid': str(game.uid),
			'playlist': {
				'name': playlist.name,
			},
			'current_track': BlindSerializer(current_track).data,
			'message': 'Test game created. Use game_uid to join via WebSocket.'
		}, status=status.HTTP_201_CREATED)
