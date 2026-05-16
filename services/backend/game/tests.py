"""Tests for the game module."""

import uuid

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from friends.models import Friendship
from music.models import Playlist, Track
from project.asgi import application
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userauth.serializers import RegisterSerializer
from userprofile.serializers import ProfileSerializer

from game.models import Game

from .models import Room


class GameWebsocketTests(TransactionTestCase):
	"""Test websocket communications during the game."""

	def setUp(self) -> None:
		"""Create base objects for testcases."""
		super().setUp()
		serializer = RegisterSerializer(data={'email':'chat_test@mail.com',
											'profile_username': 'chat_test_user',
											'password':'Password123!'},
											context={'is_creation': True})
		if serializer.is_valid():
			self.user = serializer.save()
		serializer = RegisterSerializer(data={'email': 'friend@mail.com',
											'profile_username': 'friend_user',
											'password': 'Password123!'},
										context={'is_creation': True})
		if serializer.is_valid():
			self.friend = serializer.save()
		Friendship.objects.create(from_user=self.user,
							to_user=self.friend,
							status='accepted')
		serializer = RegisterSerializer(data={'email':'other@mail.com',
											'profile_username':'other_user',
											'password': 'Password123!'},
										context={'is_creation': True})
		if serializer.is_valid():
			self.stranger = serializer.save()

		serializer = ProfileSerializer(data={'username':'guest_user'},
										context={'is_creation': True})
	
		if serializer.is_valid():
			self.guest = serializer.save()
			
		Room.objects.create(name='default_room', is_direct=False)

		serializer = ProfileSerializer(data={'username':'guest_user'},
										context={'is_creation': True})
		
		if serializer.is_valid():
			self.anonymous = serializer.save()

		self.user.friends.add(self.friend)
		self.friend.friends.add(self.user)
		self.room = Room.objects.create(name='classic')
		self.room.participants.add(self.user.profile, self.friend.profile)
		
		game_url = '/api/game/'
		game_payload = {
			'game_name': 'my_game_friends_only',
			'public_level': 'public',
		}
		response = self.client.post(game_url, game_payload, format='json')
		print(response.data)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.game_public = Game.objects.get(uid=response.data['uid'])

		#TODO should not be needed because should be handled at game creation
		self.game_public.players.add(self.user)
		self.game_public.owned_by = self.user
		self.game_public.save()
		
		game_payload = self.client.post(game_url, {
			'game_name': 'my_game_friends_only',
			'public_level': 'public'
		}, format='json')
		response = self.client.post(game_url, game_payload, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.game_friends_only = Game.objects.get(uid=response.data['uid'])

		#TODO should not be needed because should be handled at game creation
		self.game_friends_only.players.add(self.user)
		self.game_friends_only.owned_by = self.user
		self.game_friends_only.save()

	def test_update_settings(self) -> None:
		"""Test updating the game settings once created."""
		async def scenario() -> None:
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope.update({'user': self.user, 'current_game': self.game_1})
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.send_json_to({'genres': 'RNB',
									'game_mode': 'armagedon',
									'num_tracks': 122,
									'break_duration': 7,
									'playback_duration': 24,
									'fuzzy_match': True,
									'answer_public': False})
			response = await communicator.receive_json_from()
			print(response)

class GameViewTests(TestCase):
	"""Test cases for GameView endpoint."""
	
	def setUp(self) -> None:
		"""Set up test client and sample tracks."""
		self.client = APIClient()
		self.endpoint = '/api/game/'
		
		# Create sample tracks for testing
		self.rock_tracks = [
			Track.objects.create(
				itunes_id=1000 + i,
				title=f"Rock Song {i}",
				artist=f"Rock Artist {i}",
				genre="rock",
				preview_url="https://example.com/preview1.mp3"
			)
			for i in range(10)
		]
		
		self.pop_tracks = [
			Track.objects.create(
				itunes_id=2000 + i,
				title=f"Pop Song {i}",
				artist=f"Pop Artist {i}",
				genre="pop",
				preview_url="https://example.com/preview2.mp3"
			)
			for i in range(10)
		]
		
		self.jazz_tracks = [
			Track.objects.create(
				itunes_id=3000 + i,
				title=f"Jazz Song {i}",
				artist=f"Jazz Artist {i}",
				genre="jazz",
				preview_url="https://example.com/preview3.mp3"
			)
			for i in range(5)
		]
	
	def test_create_game_success(self) -> None:
		"""Test successful game creation with valid genres and tracks."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock', 'pop'],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertIn('game_uid', response.data)
		self.assertIn('playlist', response.data)
		self.assertIn('current_track', response.data)
		self.assertEqual(response.data['num_tracks'], 4)
		
		# Verify game was created
		game = Game.objects.get(uid=response.data['game_uid'])
		self.assertEqual(game.num_tracks, 4)
		self.assertEqual(game.status, 'waiting')
		self.assertEqual(game.current_round, 1)
	
	def test_playlist_created_with_correct_tracks(self) -> None:
		"""Test that playlist is created with correct number of tracks."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock', 'pop'],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		playlist = Playlist.objects.get(id=response.data['playlist']['id'])
		
		# Should have 2 rock + 2 pop = 4 tracks
		self.assertEqual(playlist.tracks.count(), 4)
		
		# Verify genre distribution
		rock_count = playlist.tracks.filter(genre='rock').count()
		pop_count = playlist.tracks.filter(genre='pop').count()
		self.assertEqual(rock_count, 2)
		self.assertEqual(pop_count, 2)
	
	def test_room_created_for_game(self) -> None:
		"""Test that a room is created for the game."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock'],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		game = Game.objects.get(uid=response.data['game_uid'])
		
		self.assertIsNotNone(game.room)
		self.assertIn('Game Room', game.room.name)
		self.assertEqual(game.room.is_direct, False)
	
	def test_invalid_genres_empty_list(self) -> None:
		"""Test error when genres list is empty."""
		response = self.client.post(self.endpoint, {
			'genres': [],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
		self.assertEqual(response.data['error'], 'Invalid genres')
	
	def test_invalid_genres_not_list(self) -> None:
		"""Test error when genres is not a list."""
		response = self.client.post(self.endpoint, {
			'genres': 'rock',
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
		self.assertEqual(response.data['error'], 'Invalid genres')
	
	def test_invalid_num_tracks_zero(self) -> None:
		"""Test error when num_tracks is zero."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock'],
			'num_tracks': 0,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
		self.assertEqual(response.data['error'], 'Invalid num_tracks')
	
	def test_invalid_num_tracks_negative(self) -> None:
		"""Test error when num_tracks is negative."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock'],
			'num_tracks': -5,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
		self.assertEqual(response.data['error'], 'Invalid num_tracks')
	
	def test_invalid_num_tracks_not_integer(self) -> None:
		"""Test error when num_tracks is not an integer."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock'],
			'num_tracks': 'four',
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
		self.assertEqual(response.data['error'], 'Invalid num_tracks')
	
	def test_not_enough_tracks_for_genre(self) -> None:
		"""Test error when not enough tracks exist for a genre."""
		response = self.client.post(self.endpoint, {
			'genres': ['jazz', 'rock'],
			'num_tracks': 20,  # Requests 10 per genre, but jazz only has 5
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
		self.assertIn('Not enough tracks for genre', response.data['error'])
	
	def test_num_tracks_less_than_genres(self) -> None:
		"""Test error when num_tracks < number of genres."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock', 'pop', 'jazz'],
			'num_tracks': 2,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
		self.assertEqual(response.data['error'], 'Not enough tracks')
	
	def test_nonexistent_genre(self) -> None:
		"""Test error when genre has no tracks."""
		response = self.client.post(self.endpoint, {
			'genres': ['nonexistent_genre'],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)
		self.assertIn('Not enough tracks for genre', response.data['error'])
	
	def test_response_includes_current_track(self) -> None:
		"""Test that response includes the current track preview (blinded)."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock'],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertIn('current_track', response.data)
		current_track = response.data['current_track']
		
		# BlindSerializer intentionally hides title/artist from players
		# Only preview_url should be included for guessing
		self.assertIn('preview_url', current_track)
		self.assertNotIn('title', current_track)
		self.assertNotIn('artist', current_track)
	
	def test_unique_playlists_created(self) -> None:
		"""Test that multiple game creations create unique playlists."""
		response1 = self.client.post(self.endpoint, {
			'genres': ['rock', 'pop'],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		response2 = self.client.post(self.endpoint, {
			'genres': ['rock', 'pop'],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
		
		# Both should have different playlist IDs
		playlist1_id = response1.data['playlist']['id']
		playlist2_id = response2.data['playlist']['id']
		self.assertNotEqual(playlist1_id, playlist2_id)
	
	def test_game_has_all_required_fields(self) -> None:
		"""Test that created game has all required fields."""
		response = self.client.post(self.endpoint, {
			'genres': ['rock'],
			'num_tracks': 4,
			'public_level': 'public'
		}, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		game = Game.objects.get(uid=response.data['game_uid'])
		
		self.assertIsNotNone(game.game_name)
		self.assertIsNotNone(game.playlist)
		self.assertIsNotNone(game.room)
		self.assertIsNotNone(game.current_track)
		self.assertEqual(game.current_round, 1)
		self.assertEqual(game.num_tracks, 4)
		self.assertEqual(game.status, 'waiting')
