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
	def setUp(self):
		self.user_model = get_user_model()
		self.user = self.user_model.objects.create_user(
			email='chat_test@mail.com',
			username='chat_test_user',
			password='Password123!',
		)
		self.room = Room.objects.create(name='classic')

	def test_room_not_found_returns_404(self):
		response = self.client.get(reverse('room', kwargs={'pk': 99999}))
		self.assertEqual(response.status_code, 404)
		self.assertEqual(response.json(), {'detail': 'Room 99999 not found'})

	def test_room_found_returns_success(self):
		response = self.client.get(reverse('room', kwargs={'pk': self.room.id}))
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), {'message': 'chat service ready'})

	def test_room_post_creates_message_and_adds_participant(self):
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


class ChatWebsocketTests(TransactionTestCase):
	def setUp(self):
		self.user_model = get_user_model()
		self.user = self.user_model.objects.create_user(
			email='ws_user@mail.com',
			username='ws_user',
			password='Password123!',
		)
		self.application = URLRouter(websocket_urlpatterns)
		self.room = Room.objects.create(name='classic')

	def test_websocket_connects_for_existing_room(self):
		async def scenario():
			communicator = WebsocketCommunicator(self.application, '/ws/chat/classic/')
			connected, _ = await communicator.connect()
			self.assertTrue(connected)
			await communicator.disconnect()

		async_to_sync(scenario)()

	def test_websocket_rejects_missing_room(self):
		async def scenario():
			communicator = WebsocketCommunicator(self.application, '/ws/chat/unknown-room/')
			connected, _ = await communicator.connect()
			self.assertFalse(connected)

		async_to_sync(scenario)()

	def test_websocket_message_requires_body(self):
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

