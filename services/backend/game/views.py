"""HTTP views for game management and testing."""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import Room
from game.models import Game
from music.models import Playlist
from music.serializers import TrackSerializer, PlaylistTracksSerializer, BlindSerializer


class GameTestView(APIView):
    """Create a test game with real music data for WebSocket testing."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Create a test game with real iTunes tracks.
        
        Returns:
            - game_id: ID of the created game
            - room_id: ID of the associated room
            - playlist: Full playlist with tracks
            - current_track: Current track details
        """
        # Create or get a test room
        room, _ = Room.objects.get_or_create(
            name='test_game_room',
            defaults={'is_direct': False}
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

        # Create a new test game or get existing one
        game, created = Game.objects.get_or_create(
            room=room,
            defaults={
                'game_name': 'Test Game',
                'playlist': playlist,
                'status': 'waiting',
                'current_round': 1,
                'current_track': current_track,
                'max_rounds': 5,
            }
        )
        
        # If game already existed, update it with new track
        if not created:
            game.current_round = 1
            game.current_track = current_track
            game.status = 'waiting'
            game.save()

        return Response({
            'game_id': game.id,
            'room_id': room.id,
            'game_name': game.game_name,
            'status': game.status,
            'playlist': {
                'id': playlist.id,
                'name': playlist.name,
                'slug': playlist.slug,
            },
            'current_track': BlindSerializer(current_track).data,
            'message': 'Test game created successfully with real music data. Use room_id to join via WebSocket.'
        }, status=status.HTTP_201_CREATED)
