"""HTTP views for game management and testing."""

import random
import uuid
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import Room
from game.models import Game
from music.models import Playlist, Track
from music.serializers import BlindSerializer


class GameView(APIView):
	"""Create a game room with real music data for WebSocket gameplay."""
	permission_classes = [AllowAny]

	def post(self, request: Request) -> Response:
		"""Create a new game room with real iTunes tracks.
		
		Request body (all optional):
			- music_kinds: list of music genres (defaults to all available)
			- song_count: limit number of songs in playlist (defaults to all)
			- fuzzy_match: boolean for fuzzy matching (default: True)
			- show_opponent_answers: boolean to display opponent answers (default: True)
		
		Returns:
			- game_uid: UUID of the created game
			- playlist: Playlist name with kinds included
			- current_track: Current track preview URL
		"""
		# Extract optional parameters with defaults
		music_kinds = request.data.get('music_kinds', None)
		song_count = request.data.get('song_count', None)
		fuzzy_match = request.data.get('fuzzy_match', True)
		show_opponent_answers = request.data.get('show_opponent_answers', True)
		
		# Create a new game room with unique name
		room = Room.objects.create(
			name=f'game_room_{uuid.uuid4().hex[:8]}',
			is_direct=False
		)

		# Filter tracks by music kinds if provided, otherwise get all tracks
		if music_kinds and isinstance(music_kinds, list):
			tracks = Track.objects.filter(kind__in=music_kinds)
			playlist_name = f'Mixed_{"-".join(music_kinds)}'
		else:
			tracks = Track.objects.all()
			playlist_name = 'All Tracks'
		
		if not tracks.exists():
			return Response({
				'error': 'No tracks found for the specified music kinds',
				'message': f'Available kinds: {list(Track.objects.values_list("kind", flat=True).distinct())}'
			}, status=status.HTTP_400_BAD_REQUEST)
		
		# Limit song count if specified
		if song_count and isinstance(song_count, int) and song_count > 0:
			# Randomly sample songs from filtered tracks
			available_count = tracks.count()
			if song_count > available_count:
				return Response({
					'error':'Not enough tracks for the specified song_count',
					'message': f'Requested {song_count} songs but only {available_count} available for {music_kinds or "all genres"}'
				}, status=status.HTTP_400_BAD_REQUEST)
			
			# Get random sample of tracks
			track_ids = list(tracks.values_list('pk', flat=True))
			random_track_ids = random.sample(track_ids, song_count)
			tracks = Track.objects.filter(pk__in=random_track_ids)
			playlist_name += f'_{song_count}songs'
		
		# Create or get a playlist with the mixed kinds
		playlist, created = Playlist.objects.get_or_create(
			name=playlist_name,
			defaults={'slug': playlist_name.lower().replace(' ', '_')}
		)
		
		# Add filtered tracks to the playlist
		playlist.tracks.set(tracks)

		# Get random track from filtered tracks
		current_track = tracks.order_by('?').first()
		
		if not current_track:
			return Response({
				'error': 'No tracks available',
				'message': 'Please check your music database'
			}, status=status.HTTP_400_BAD_REQUEST)

		# Create a new game
		game = Game.objects.create(
			room=room,
			game_name='Game',
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
				'track_count': playlist.tracks.count(),
			},
			'current_track': BlindSerializer(current_track).data,
			'music_kinds': music_kinds,
			'song_count': song_count,
			'fuzzy_match': fuzzy_match,
			'show_opponent_answers': show_opponent_answers,
			'message': 'Game room created. Use game_uid to join via WebSocket.'
		}, status=status.HTTP_201_CREATED)
