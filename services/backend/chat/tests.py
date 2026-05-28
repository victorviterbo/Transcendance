"""Tests for chat HTTP endpoints and WebSocket behavior."""

import uuid

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from django.urls import reverse
from friends.models import Friendship
from project.asgi import application
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userauth.serializers import RegisterSerializer
from userprofile.serializers import ProfileSerializer

from .models import Message, Room


class ChatViewsTests(APITestCase):
	"""Validate chat HTTP endpoints."""

	def setUp(self) -> None:
		"""Create users and rooms used by the view tests."""
		self.client = APIClient()
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
	
		serializer = RegisterSerializer(data={'email':'other@mail.com',
											'profile_username':'other_user',
											'password': 'Password123!'},
										context={'is_creation': True})
		if serializer.is_valid():
			self.other_user = serializer.save()
		
		Friendship.objects.create(from_user=self.user,
							to_user=self.friend,
							status='accepted')
		
		self.user.friends.add(self.friend)
		self.friend.friends.add(self.user)
		self.room = Room.objects.create(name='classic')

	def test_room_not_found_returns_404(self) -> None:
		"""Missing rooms should return a 404 response."""
		response = self.client.get('/api/chat/room/' + str(self.user.uid) + '/')
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
		self.assertEqual(response.data, {'error': {'room': 'ROOM_NOT_FOUND'}})

	def test_room_found_returns_success(self) -> None:
		"""Existing public rooms should return their serialized payload."""
		response = self.client.get(reverse('room', kwargs={'room_uid': self.room.uid}))
		self.assertEqual(response.status_code, 200)
		self.assertEqual(uuid.UUID(response.data['uid']), self.room.uid)
		self.assertEqual(response.data['name'], 'classic')
		self.assertFalse(response.data['is_direct'])
		self.assertEqual(response.data['participants'], [])

	def test_room_exclude_history_query(self) -> None:
		"""Room lookup should return room metadata even when include_history is passed."""
		Message.objects.create(
			sender_profile=self.user.profile,
			room=self.room,
			body='first message',
		)
		Message.objects.create(
			sender_profile=self.friend.profile,
			room=self.room,
			body='second message',
		)
		response = self.client.get(
			reverse('room', kwargs={'room_uid': self.room.uid}) + '?include_history=1'
		)
		self.assertEqual(response.status_code, 200)
		self.assertNotIn('history', response.data)
		self.assertEqual(uuid.UUID(response.data['uid']), self.room.uid)
		self.assertEqual(response.data['name'], 'classic')

	def test_room_post_creates_message_and_adds_participant(self) -> None:
		"""Posting to a room should create a message and add the sender as participant."""
		self.client.force_login(self.user)
		response = self.client.post(
			reverse('room', kwargs={'room_uid': self.room.uid}),
			{'body': 'hello room'},
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(
			Message.objects.filter(room=self.room,
						sender_profile=self.user.profile,
						body='hello room').exists()
						)
		self.assertTrue(self.room.participants.filter(uid=self.user.profile.uid).exists())

	def test_rooms_post_creates_public_room(self) -> None:
		"""Posting to the room list endpoint should create a public room."""
		self.client.force_login(self.user)
		response = self.client.post(
			reverse('room', kwargs={'room_uid': self.room.uid}),
			data={'body': 'hello !'},
			content_type='application/json',
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(Room.objects.filter(uid=self.room.uid,
											is_direct=False).exists())
		self.assertTrue(Room.objects.filter(name=self.room.name,
											is_direct=False).exists())

	def test_direct_room_created_for_friends(self) -> None:
		"""Direct-room creation should return a shared DM room for friends."""
		login_url = '/api/auth/login/'
		login_res = self.client.post(login_url, data={'email': self.user.email,
                                              'password': 'Password123!'})
		self.assertEqual(login_res.status_code, status.HTTP_200_OK)
		access = login_res.data.get('access')
		self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
	
		response = self.client.post('/api/chat/direct/',
									data={'user_uid': self.friend.uid})
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		payload = response.data
		self.assertTrue(payload['is_direct'])
		self.assertTrue(payload['is_new'])
		room = Room.objects.get(uid=payload['room_uid'])
		self.assertTrue(room.participants.filter(id=self.user.id).exists())
		self.assertTrue(room.participants.filter(id=self.friend.id).exists())

	def test_direct_room_rejected_for_nonfriend(self) -> None:
		"""Non-friends should be blocked from direct-room creation."""
		login_url = '/api/auth/login/'
		login_res = self.client.post(login_url, data={'email': self.user.email,
                                              'password': 'Password123!'})
		self.assertEqual(login_res.status_code, status.HTTP_200_OK)
		access = login_res.data.get('access')
		self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
		response = self.client.post('/api/chat/direct/',
									data={'user_uid': self.other_user.uid})
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class ChatWebsocketTests(TransactionTestCase):
	"""Validate WebSocket connection rules and message flow."""

	def setUp(self) -> None:
		"""Create users, rooms, and the ASGI application for socket tests."""
		serializer = RegisterSerializer(data={'email':'test@mail.com',
											'profile_username': 'test_user',
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
		#self.application = URLRouter(websocket_urlpatterns)
		self.room = Room.objects.create(name='classic')
		self.room.participants.add(self.user.profile, self.friend.profile)

	def test_websocket_connects_exist_room(self) -> None:
		"""Existing public rooms should accept WebSocket connections."""
		async def scenario() -> None:
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_connects_for_existing_room_as_anon(self) -> None:
		"""Existing public rooms should accept WebSocket connections."""
		async def scenario() -> None:
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope['user'] = self.guest
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_rejects_missing_room(self) -> None:
		"""Unknown room names should be rejected during connection."""
		async def scenario() -> None:
			communicator = WebsocketCommunicator(application, '/ws/chat/unknown-room/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertFalse(connected)

		async_to_sync(scenario)()

	def test_websocket_message_requires_body(self) -> None:
		"""Blank WebSocket messages should return an error payload."""
		async def scenario() -> None:
			communicator = WebsocketCommunicator(application, 'ws/global/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.send_json_to({'target': 'chat',
									'event': 'chat-message',
									'message': '   '})
			response = await communicator.receive_json_from()
			self.assertEqual(response, {'type': 'error',
										'message': 'message is required'})
			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_authenticated_message_is_saved(self) -> None:
		"""Authenticated socket messages should broadcast and persist."""
		async def scenario() -> None:
			comm = WebsocketCommunicator(application, '/ws/global/')
			comm.scope['user'] = self.user
			connected, _ = await comm.connect()
			self.assertTrue(connected)

			await comm.send_json_to({
				'target': 'chat', 'event': 'chat-message',
				'message': 'hello websocket', 'room_uid': str(self.room.uid),
			})
			resp = await comm.receive_json_from()
			self.assertEqual(resp['type'], 'chat_message')
			self.assertEqual(resp['message'], 'hello websocket')


			await comm.send_json_to({
				'target': 'chat', 'event': 'direct-message',
				'message': 'hello friend', 'user_uid': str(self.friend.uid),
			})
			dm = None
			for _ in range(3):
				r = await comm.receive_json_from()
				if r.get('target') == 'friend-chat' and r.get('event') == 'new':
					dm = r
					break
			self.assertIsNotNone(dm)
			self.assertEqual(dm['message']['message'], 'hello friend')

			await comm.disconnect()

		async_to_sync(scenario)()
		self.assertTrue(Message.objects.filter(sender_profile=self.user.profile, body='hello websocket').exists())
		self.assertTrue(self.room.participants.filter(id=self.user.profile.id).exists())

	def test_direct_room_websocket_accepts_participant(self) -> None:
		"""Direct-room participants should be allowed to connect."""

		async def scenario() -> None:
			communicator = WebsocketCommunicator(application, '/ws/global/')
			communicator.scope['user'] = self.user
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()
