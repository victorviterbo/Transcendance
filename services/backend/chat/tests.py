"""Tests for chat HTTP endpoints and WebSocket behavior."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.test import TransactionTestCase
from django.urls import reverse
from asgiref.sync import async_to_sync
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator

from .models import Message, Room
from .routing import websocket_urlpatterns


class ChatViewsTests(TestCase):
	"""Validate chat HTTP endpoints."""

	def setUp(self):
		"""Create users and rooms used by the view tests."""

		self.user_model = get_user_model()
		self.user = self.user_model.objects.create_user(
			email='chat_test@mail.com',
			username='chat_test_user',
			password='Password123!',
		)
		self.friend = self.user_model.objects.create_user(
			email='friend@mail.com',
			username='friend_user',
			password='Password123!',
		)
		self.other_user = self.user_model.objects.create_user(
			email='other@mail.com',
			username='other_user',
			password='Password123!',
		)
		self.user.friends.add(self.friend)
		self.friend.friends.add(self.user)
		self.room = Room.objects.create(name='classic')

	def test_room_not_found_returns_404(self):
		"""Missing rooms should return a 404 response."""

		response = self.client.get(reverse('room', kwargs={'pk': 99999}))
		self.assertEqual(response.status_code, 404)
		self.assertEqual(response.json(), {'detail': 'Room 99999 not found'})

	def test_room_found_returns_success(self):
		"""Existing public rooms should return their serialized payload."""

		response = self.client.get(reverse('room', kwargs={'pk': self.room.id}))
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()['room']['id'], self.room.id)
		self.assertEqual(response.json()['room']['name'], 'classic')
		self.assertFalse(response.json()['room']['is_direct'])
		self.assertEqual(response.json()['participants'], [])
		self.assertEqual(response.json()['messages'], [])

	def test_room_post_creates_message_and_adds_participant(self):
		"""Posting to a room should create a message and add the sender as participant."""

		self.client.force_login(self.user)

		response = self.client.post(
			reverse('room', kwargs={'pk': self.room.id}),
			{'body': 'hello room'},
		)

		self.assertEqual(response.status_code, 302)
		self.assertTrue(
			Message.objects.filter(room=self.room, user=self.user, body='hello room').exists()
		)
		self.assertTrue(self.room.participants.filter(id=self.user.id).exists())

	def test_rooms_post_creates_public_room(self):
		"""Posting to the room list endpoint should create a public room."""

		self.client.force_login(self.user)
		response = self.client.post(
			reverse('room-list-create'),
			data='{"name": "games"}',
			content_type='application/json',
		)
		self.assertEqual(response.status_code, 201)
		self.assertTrue(Room.objects.filter(name='games', is_direct=False).exists())

	def test_direct_room_is_created_for_friends(self):
		"""Direct-room creation should return a shared DM room for friends."""

		self.client.force_login(self.user)
		response = self.client.post(reverse('direct-room', kwargs={'user_id': self.friend.id}))
		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertTrue(payload['is_direct'])
		room = Room.objects.get(id=payload['id'])
		self.assertTrue(room.participants.filter(id=self.user.id).exists())
		self.assertTrue(room.participants.filter(id=self.friend.id).exists())

	def test_direct_room_is_rejected_for_non_friend(self):
		"""Non-friends should be blocked from direct-room creation."""

		self.client.force_login(self.user)
		response = self.client.post(reverse('direct-room', kwargs={'user_id': self.other_user.id}))
		self.assertEqual(response.status_code, 403)


class ChatWebsocketTests(TransactionTestCase):
	"""Validate WebSocket connection rules and message flow."""

	def setUp(self):
		"""Create users, rooms, and the ASGI application for socket tests."""

		self.user_model = get_user_model()
		self.user = self.user_model.objects.create_user(
			email='ws_user@mail.com',
			username='ws_user',
			password='Password123!',
		)
		self.friend = self.user_model.objects.create_user(
			email='ws_friend@mail.com',
			username='ws_friend',
			password='Password123!',
		)
		self.stranger = self.user_model.objects.create_user(
			email='ws_stranger@mail.com',
			username='ws_stranger',
			password='Password123!',
		)
		self.user.friends.add(self.friend)
		self.friend.friends.add(self.user)
		self.application = URLRouter(websocket_urlpatterns)
		self.room = Room.objects.create(name='classic')
		first, second = sorted([self.user.id, self.friend.id])
		self.direct_key = f'dm_{first}_{second}'
		self.direct_room = Room.objects.create(
			name=self.direct_key,
			is_direct=True,
			direct_key=self.direct_key,
		)
		self.direct_room.participants.add(self.user, self.friend)

	def test_websocket_connects_for_existing_room(self):
		"""Existing public rooms should accept WebSocket connections."""

		async def scenario():
			communicator = WebsocketCommunicator(self.application, '/ws/chat/classic/')
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_rejects_missing_room(self):
		"""Unknown room names should be rejected during connection."""

		async def scenario():
			communicator = WebsocketCommunicator(self.application, '/ws/chat/unknown-room/')
			connected, _ = await communicator.connect()
			self.assertFalse(connected)

		async_to_sync(scenario)()

	def test_websocket_message_requires_body(self):
		"""Blank WebSocket messages should return an error payload."""

		async def scenario():
			communicator = WebsocketCommunicator(self.application, '/ws/chat/classic/')
			connected, _ = await communicator.connect()
			self.assertTrue(connected)

			await communicator.send_json_to({'action': 'message', 'message': '   '})
			response = await communicator.receive_json_from()
			self.assertEqual(response, {'type': 'error', 'message': 'message is required'})

			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_authenticated_message_is_saved(self):
		"""Authenticated socket messages should be broadcast and persisted."""

		async def scenario():
			communicator = WebsocketCommunicator(self.application, '/ws/chat/classic/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertTrue(connected)

			await communicator.send_json_to({'action': 'message', 'message': 'hello websocket'})
			response = await communicator.receive_json_from()
			self.assertEqual(response['type'], 'chat_message')
			self.assertEqual(response['sender'], 'ws_user')
			self.assertEqual(response['message'], 'hello websocket')

			await communicator.disconnect()

		async_to_sync(scenario)()

		self.assertTrue(
			Message.objects.filter(room=self.room, user=self.user, body='hello websocket').exists()
		)
		self.assertTrue(self.room.participants.filter(id=self.user.id).exists())

	def test_direct_room_websocket_rejects_non_participant(self):
		"""Users outside a direct room should not be allowed to connect."""

		async def scenario():
			communicator = WebsocketCommunicator(self.application, f'/ws/chat/{self.direct_key}/')
			communicator.scope['user'] = self.stranger
			connected, _ = await communicator.connect()
			self.assertFalse(connected)

		async_to_sync(scenario)()

	def test_direct_room_websocket_accepts_participant(self):
		"""Direct-room participants should be allowed to connect."""

		async def scenario():
			communicator = WebsocketCommunicator(self.application, f'/ws/chat/{self.direct_key}/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()

