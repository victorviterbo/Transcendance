"""Tests for chat HTTP endpoints and WebSocket behavior."""

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from friends.models import Friendship
from project.asgi import application
from rest_framework import status
from userauth.models import SiteUser
from userauth.serializers import SiteUserSerializer
from userprofile.serializers import ProfileSerializer

from .models import Message, Room


class ChatViewsTests(TestCase):
	"""Validate chat HTTP endpoints."""

	def setUp(self) -> None:
		"""Create users and rooms used by the view tests."""
		serializer = SiteUserSerializer(data={'email':'chat_test@mail.com',
											'profile_username': 'chat_test_user',
											'password':'Password123!'},
											context={'is_creation': True})
		if serializer.is_valid():
			self.user = serializer.save()
	
		serializer = SiteUserSerializer(data={'email': 'friend@mail.com',
											'profile_username': 'friend_user',
											'password': 'Password123!'},
										context={'is_creation': True})
		if serializer.is_valid():
			self.friend = serializer.save()
	
		serializer = SiteUserSerializer(data={'email':'other@mail.com',
											'profile_username':'other_user',
											'password': 'Password123!'},
										context={'is_creation': True})
		if serializer.is_valid():
			self.other_user = serializer.save()
		self.user.friends.add(self.friend)
		self.friend.friends.add(self.user)
		self.room = Room.objects.create(name='classic')

	def test_room_not_found_returns_404(self) -> None:
		"""Missing rooms should return a 404 response."""
		response = self.client.get(reverse('room', kwargs={'pk': 99999}))
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
		self.assertEqual(response.json(), {'error': {'room': 'ROOM_NOT_FOUND'}})

	def test_room_found_returns_success(self) -> None:
		"""Existing public rooms should return their serialized payload."""
		response = self.client.get(reverse('room', kwargs={'pk': self.room.id}))
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()['room']['id'], self.room.id)
		self.assertEqual(response.json()['room']['name'], 'classic')
		self.assertFalse(response.json()['room']['is_direct'])
		self.assertEqual(response.json()['participants'], [])
		self.assertEqual(response.json()['messages'], [])

	def test_room_post_creates_message_and_adds_participant(self) -> None:
		"""Posting to a room should create a message and add the sender as participant."""
		self.client.force_login(self.user)

		response = self.client.post(
			reverse('room', kwargs={'pk': self.room.id}),
			{'body': 'hello room'},
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(
			Message.objects.filter(room=self.room, user=self.user, body='hello room').exists()
		)
		self.assertTrue(self.room.participants.filter(id=self.user.id).exists())

	def test_rooms_post_creates_public_room(self) -> None:
		"""Posting to the room list endpoint should create a public room."""
		self.client.force_login(self.user)
		response = self.client.post(
			reverse('room', kwargs={'pk': 1}),
			data='{"name": "games"}',
			content_type='application/json',
		)
		self.assertEqual(response.status_code, 201)
		self.assertTrue(Room.objects.filter(name='games', is_direct=False).exists())

	def test_direct_room_is_created_for_friends(self) -> None:
		"""Direct-room creation should return a shared DM room for friends."""
		self.client.force_login(self.user)
		response = self.client.post(reverse('direct-room', kwargs={'user_id': self.friend.id}))
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
		payload = response.data()
		self.assertTrue(payload['is_direct'])
		room = Room.objects.get(id=payload['id'])
		self.assertTrue(room.participants.filter(id=self.user.id).exists())
		self.assertTrue(room.participants.filter(id=self.friend.id).exists())

	def test_direct_room_is_rejected_for_non_friend(self) -> None:
		"""Non-friends should be blocked from direct-room creation."""
		self.client.force_login(self.user)
		response = self.client.post(reverse('direct-room', kwargs={'user_id': self.other_user.id}))
		self.assertEqual(response.status_code, status=status.HTTP_403_FORBIDDEN)


class ChatWebsocketTests(TransactionTestCase):
	"""Validate WebSocket connection rules and message flow."""

	def setUp(self) -> None:
		"""Create users, rooms, and the ASGI application for socket tests."""
		serializer = SiteUserSerializer(data={'email':'chat_test@mail.com',
											'profile_username': 'chat_test_user',
											'password':'Password123!'},
											context={'is_creation': True})
		if serializer.is_valid():
			self.user = serializer.save()
	
		serializer = SiteUserSerializer(data={'email': 'friend@mail.com',
											'profile_username': 'friend_user',
											'password': 'Password123!'},
										context={'is_creation': True})
		if serializer.is_valid():
			self.friend = serializer.save()
		Friendship.objects.create(from_user=self.user,
							to_user=self.friend,
							status='Accepted')
		serializer = SiteUserSerializer(data={'email':'other@mail.com',
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
		#self.application = URLRouter(websocket_urlpatterns)
		self.room = Room.objects.create(name='classic')
		"""first, second = sorted([self.user.id, self.friend.id])
		self.direct_key = f'dm_{first}_{second}'
		self.direct_room = Room.objects.create(
			name=self.direct_key,
			is_direct=True,
			direct_key=self.direct_key,
		)
		self.direct_room.participants.add(self.user.profile, self.friend.profile)"""
		self.room.participants.add(self.user.profile, self.friend.profile)

	def test_websocket_connects_for_existing_room(self) -> None:
		"""Existing public rooms should accept WebSocket connections."""
		async def scenario():
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_connects_for_existing_room_as_anon(self) -> None:
		"""Existing public rooms should accept WebSocket connections."""
		async def scenario():
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope['user'] = self.guest
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_rejects_missing_room(self) -> None:
		"""Unknown room names should be rejected during connection."""
		async def scenario():
			communicator = WebsocketCommunicator(application, '/ws/chat/unknown-room/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertFalse(connected)

		async_to_sync(scenario)()

	def test_websocket_message_requires_body(self) -> None:
		"""Blank WebSocket messages should return an error payload."""
		async def scenario():
			communicator = WebsocketCommunicator(application, 'ws/global/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.send_json_to({'module': 'chat',
									'action': 'chat-message',
									'message': '   '})
			response = await communicator.receive_json_from()
			self.assertEqual(response, {'type': 'error',
										'message': 'message is required'})
			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_authenticated_message_is_saved(self) -> None:
		"""Authenticated socket messages should broadcast and persist."""
		async def scenario():
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope['user'] = self.user
			communicator.scope['module'] = 'chat'
			connected, _ = await communicator.connect()
			self.assertTrue(connected)

			await communicator.send_json_to({'module': 'chat',
									'action': 'chat-message',
									'message': 'hello websocket',
									'room-uid': str(self.room.uid)})
			
			response = await communicator.receive_json_from()
			self.assertEqual(response['type'], 'chat_message')
			self.assertEqual(response['sender'], 'chat_test_user')
			self.assertEqual(response['message'], 'hello websocket')

			await communicator.send_json_to({'module': 'chat',
									'action': 'direct-message',
									'message': 'hello friend',
									'user-uid': str(self.friend.uid)})
			response = await communicator.receive_json_from()
			self.assertEqual(response['type'], 'chat_message')
			self.assertEqual(response['sender'], 'chat_test_user')
			self.assertEqual(response['message'], 'hello friend')

			await communicator.send_json_to({'module': 'chat',
									'action': 'direct-message',
									'message': 'hello stranger',
									'user-uid': str(self.stranger.uid)})
			response = await communicator.receive_json_from()
			self.assertEqual(response['type'], 'error')
			self.assertEqual(response['message'], 'Target is not a friend')

			await communicator.send_json_to({'module': 'chat',
									'action': 'direct-message',
									'message': 'hello guest',
									'user-uid': str(self.guest.uid)})
			response = await communicator.receive_json_from()
			self.assertEqual(response['type'], 'error')
			self.assertEqual(response['message'], 'User not found')

			await communicator.disconnect()

		async_to_sync(scenario)()
		self.assertTrue(
			Message.objects.filter(sender_profile=self.user.profile,
									body='hello websocket').exists()
		)
		self.assertTrue(self.room.participants.filter(id=self.user.profile.id).exists())

	def test_direct_room_websocket_rejects_non_participant(self) -> None:
		"""Users outside a direct room should not be allowed to connect."""

		async def scenario():
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope['user'] = self.stranger
			connected, _ = await communicator.connect()
			self.assertTrue(connected)

		async_to_sync(scenario)()

	def test_direct_room_websocket_accepts_participant(self) -> None:
		"""Direct-room participants should be allowed to connect."""

		async def scenario():
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()
