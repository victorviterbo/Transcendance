"""Tests for game HTTP endpoints and websocket flow."""

import json
import random
import uuid

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from chat.models import Message, Room
from django.test import TransactionTestCase
from friends.models import Friendship
from game.models import Game
from music.models import Track
from project.asgi import application
from project.defaults import genres
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userauth.models import SiteUser
from userauth.serializers import RegisterSerializer

from tests.test_helpers import TestBaseHelpers, TestWebsocketHelpers, urls


class GameHTTPViewTests(TestBaseHelpers):
    """Validate game HTTP endpoints and creation contract."""

    def setUp(self) -> None:
        self.owner = self.create_user('owner@mail.com', 'game_owner')
        self.friend = self.create_user('friend@mail.com', 'game_friend')
        self.stranger = self.create_user('stranger@mail.com', 'game_stranger')
        login_res = self.client.post(urls['login'], data={'email': 'owner@mail.com',
                                                 'password': 'Password123!'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)

    def test_create_game_with_required_payload_only(self) -> None:
        """Game creation should only require name and visibility."""
        login_res = self.client.post(urls['login'], data={'email': 'owner@mail.com',
                                                 'password': 'Password123!'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
        response = self.client.post(
            '/api/game/',
            {
                'name': 'Friday Quiz',
                'visibility': 'public',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn('uid', response.data)
        self.assertEqual(response.data['name'], 'Friday Quiz')

        game = Game.objects.get(uid=response.data['uid'])
        self.assertEqual(game.name, 'Friday Quiz')
        self.assertEqual(game.owned_by.uid, self.owner.profile.uid)
        self.assertIsNotNone(game.room)
        self.assertEqual(game.room.name, f'Chat Room - {game.uid}')

    def test_create_game_missing_name_returns_structured_error(self) -> None:
        """Missing required fields should use normalized error codes."""
        response = self.client.post(
            '/api/game/',
            {'visibility': 'public'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'error': {'name': 'REQUIRED_NAME'}})

    def test_create_game_invalid_visibility_returns_structured_error(self) -> None:
        """Invalid visibility values should return an explicit validation code."""
        response = self.client.post(
            '/api/game/',
            {'name': 'Bad Level', 'visibility': 'everyone'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {'error': {'visibility': 'INVALID_CHOICE_VISIBILITY'}},
        )

    def test_list_endpoint_returns_only_public_games(self) -> None:
        """General listing endpoint should expose only public games."""
        public_game = Game.objects.create(
            name='Public Match',
            visibility='public',
            owned_by=self.owner.profile,
        )
        private_game = Game.objects.create(
            name='Friends Match',
            visibility='friends',
            owned_by=self.owner.profile,
        )

        response = self.client.get('/api/game/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_uids = {entry['uid'] for entry in response.data}
        self.assertIn(str(public_game.uid), returned_uids)
        self.assertNotIn(str(private_game.uid), returned_uids)

    def test_friends_endpoint_returns_only_friends_owned_games(self) -> None:
        """Friends listing should include only friends' friends games."""
        Friendship.objects.create(
            from_user=self.owner,
            to_user=self.friend,
            status='accepted',
        )
        friend_game = Game.objects.create(
            name='Friend Match',
            visibility='friends',
            owned_by=self.friend.profile,
        )
        stranger_game = Game.objects.create(
            name='Stranger Match',
            visibility='friends',
            owned_by=self.stranger.profile,
        )
        login_res = self.client.post(urls['login'], data={'email': 'owner@mail.com',
                                                 'password': 'Password123!'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)

        response = self.client.get('/api/game/friends/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_uids = {entry['uid'] for entry in response.data}
        self.assertIn(str(friend_game.uid), returned_uids)
        self.assertNotIn(str(stranger_game.uid), returned_uids)

    def test_single_game_get_returns_game_payload(self) -> None:
        """Single game endpoint should return a game by UID."""
        game = Game.objects.create(
            name='Single Lookup',
            visibility='public',
            owned_by=self.owner.profile,
        )

        response = self.client.get(f'/api/game/{game.uid}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['uid'], str(game.uid))
        self.assertEqual(response.data['name'], 'Single Lookup')


class GameWebsocketFlowTests(TestWebsocketHelpers, TestBaseHelpers):
    """Validate websocket game lifecycle after HTTP creation."""

    def setUp(self) -> None:
        self.owner = self.create_user('ws-owner@mail.com', 'ws_owner')
        self.challenger = self.create_user('ws-challenger@mail.com', 'ws_challenger')

    def test_join_game_rejects_unknown_game_uid(self) -> None:
        """join_game should fail when the target game does not exist."""

        async def scenario() -> str:
            communicator = await self._connect_socket(self.challenger)

            await communicator.send_json_to(
                {
                    'target': 'game',
                    'event': 'join_game',
                    'uid': str(uuid.uuid4()),
                }
            )
            response = await communicator.receive_json_from()
            self.assertEqual(response['target'], 'game')
            self.assertEqual(response['event'], 'error')
            self.assertEqual(response['message'], 'Game not found')
            await communicator.disconnect()

        async_to_sync(scenario)()

    def test_http_creation_then_websocket_settings_update(self) -> None:
        """A game created by HTTP should be configurable through websocket."""
        _, game = self.create_game_via_http(self.owner, name='WS Settings')

        async def scenario() -> None:
            communicator = await self._connect_socket(self.owner)

            await communicator.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            
            await self.expect_event(communicator, 'message_history')
            await self.expect_event(communicator, 'player_joined')

            await communicator.send_json_to(
                {
                    'target': 'game',
                    'event': 'update_settings',
                    'uid': str(game.uid),
                    'genres': ['Pop', 'Rock'],
                    'mode': 'speed',
                    'trackCount': 6,
                    'playbackDuration': '20',
                    'breakDuration': '05',
                    'fuzzy': False,
                    'reveal': True,
                }
            )
            response = await self.expect_event(communicator, 'settings_updated')
            self.assertEqual(response['target'], 'game')
            self.assertEqual(response['event'], 'settings_updated')
            self.assertEqual(response['settings']['genres'], ['Pop', 'Rock'])
            self.assertEqual(response['settings']['mode'], 'speed')
            self.assertEqual(response['settings']['trackCount'], 6)
            await communicator.disconnect()

        async_to_sync(scenario)()

        game.refresh_from_db()
        self.assertEqual(game.genres, ['Pop', 'Rock'])
        self.assertEqual(game.mode, 'speed')
        self.assertEqual(game.trackCount, 6)
        self.assertEqual(game.fuzzy, False)
        self.assertEqual(game.reveal, True)

    def test_websocket_settings_validation_error_is_structured(self) -> None:
        """Invalid settings over websocket should return the normalized error format."""
        _, game = self.create_game_via_http(self.owner, name='WS Validation')

        async def scenario() -> None:
            owner_socket = await self._connect_socket(self.owner)

            await owner_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )

            await self.expect_event(owner_socket, 'message_history')
            await self.expect_event(owner_socket, 'player_joined')

            await owner_socket.send_json_to(
                {
                    'target': 'game',
                    'event': 'update_settings',
                    'uid': str(game.uid),
                    'genres': ['Metal'],
                }
            )
            response = await self.expect_event(owner_socket, 'error')
            self.assertEqual(response['target'], 'game')
            self.assertEqual(response['event'], 'error')
            self.assertEqual(response['error'], {'genres': 'INVALID_GENRES'})
            await owner_socket.disconnect()

        async_to_sync(scenario)()

    def test_join_game_broadcasts_new_player(self) -> None:
        """A challenger joining should notify existing members and persist membership."""
        _, game = self.create_game_via_http(self.owner, name='WS Join')

        async def scenario() -> None:
            owner_socket = await self._connect_socket(self.owner)

            challenger_socket = await self._connect_socket(self.challenger)

            await owner_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            owner_first_message = await self.expect_event(owner_socket, 'message_history')
            owner_join_response = await self.expect_event(owner_socket, 'player_joined')

            await challenger_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            challenger_history = await self.expect_event(challenger_socket, 'message_history')
            challenger_join_response = await self.expect_event(challenger_socket, 'player_joined')
            owner_broadcast = await self.expect_event(owner_socket, 'player_joined')

            self.assertEqual(challenger_join_response['target'], 'game')
            self.assertEqual(challenger_join_response['event'], 'player_joined')
            self.assertEqual(challenger_history['target'], 'game')
            self.assertEqual(challenger_history['event'], 'message_history')
            self.assertEqual(challenger_history['uid'], str(game.uid))
            self.assertEqual(challenger_history['self']['uid'], str(self.challenger.profile.uid))
            self.assertEqual(challenger_history['messages'], [])
            self.assertEqual(owner_broadcast['target'], 'game')
            self.assertEqual(owner_broadcast['event'], 'player_joined')
            self.assertEqual(owner_broadcast['player']['uid'],
                             str(self.challenger.profile.uid))

            await challenger_socket.disconnect()
            await owner_socket.disconnect()

        async_to_sync(scenario)()

        game.refresh_from_db()
        self.assertTrue(game.players.filter(id=self.challenger.profile.id).exists())

    def test_join_game_sends_chat_history_to_joining_player(self) -> None:
        """A player joining should receive the linked room's persisted chat history."""
        _, game = self.create_game_via_http(self.owner, name='WS History Join')
        room = Room.objects.create(name=f'chat-room-{game.uid}')
        game.room = room
        game.save(update_fields=['room'])

        first_message = Message.objects.create(
            sender=self.owner.profile,
            room=room,
            body='first message',
        )
        second_message = Message.objects.create(
            sender=self.owner.profile,
            room=room,
            body='second message',
        )

        async def scenario() -> None:
            owner_socket = await self._connect_socket(self.owner)

            challenger_socket = await self._connect_socket(self.challenger)

            await challenger_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            history_response = await self.expect_event(challenger_socket, 'message_history')
            join_response = await self.expect_event(challenger_socket, 'player_joined')

            self.assertEqual(join_response['target'], 'game')
            self.assertEqual(join_response['event'], 'player_joined')
            self.assertEqual(history_response['target'], 'game')
            self.assertEqual(history_response['event'], 'message_history')
            self.assertEqual(history_response['uid'], str(game.uid))
            self.assertEqual(history_response['self']['uid'], str(self.challenger.profile.uid))
            self.assertEqual(
                [entry['uid'] for entry in history_response['messages']],
                [str(first_message.uid), str(second_message.uid)],
            )
            self.assertEqual(
                [entry['body'] for entry in history_response['messages']],
                ['first message', 'second message'],
            )
            self.assertEqual(
                [entry['sender']['uid'] for entry in history_response['messages']],
                [str(self.owner.profile.uid), str(self.owner.profile.uid)],
            )

            await challenger_socket.disconnect()
            await owner_socket.disconnect()

        async_to_sync(scenario)()

        game.refresh_from_db()
        self.assertTrue(game.players.filter(id=self.challenger.profile.id).exists())

    def test_live_game_chat_is_broadcast_to_all_players(self) -> None:
        """Live chat sent during a game should reach every socket in the game room."""
        _, game = self.create_game_via_http(self.owner, name='WS Live Chat')

        async def scenario() -> None:
            owner_socket = await self._connect_socket(self.owner)

            challenger_socket = await self._connect_socket(self.challenger)

            # Both players join the game
            await owner_socket.send_json_to({'target': 'game', 'event': 'join_game', 'uid': str(game.uid)})
            await challenger_socket.send_json_to({'target': 'game', 'event': 'join_game', 'uid': str(game.uid)})

            # Send a single chat message from owner
            await owner_socket.send_json_to({
                'target': 'game',
                'event': 'message_send',
                'message': 'hello everyone',
            })

            async def pull_chat(comm):
                for _ in range(8):
                    try:
                        resp = await comm.receive_json_from(timeout=1)
                    except Exception:
                        continue
                    if resp.get('target') == 'game' and resp.get('event') == 'message_broadcast':
                        return resp
                return None

            owner_chat = await pull_chat(owner_socket)
            challenger_chat = await pull_chat(challenger_socket)

            self.assertIsNotNone(owner_chat)
            self.assertIsNotNone(challenger_chat)
            self.assertEqual(owner_chat['uid'], str(game.uid))
            self.assertEqual(challenger_chat['uid'], str(game.uid))
            self.assertNotIn('created', owner_chat)
            self.assertNotIn('created', challenger_chat)
            self.assertEqual(owner_chat['message']['uid'], challenger_chat['message']['uid'])
            self.assertEqual(owner_chat['message']['body'], 'hello everyone')
            self.assertEqual(challenger_chat['message']['body'], 'hello everyone')
            self.assertEqual(owner_chat['message']['sender']['uid'], str(self.owner.profile.uid))
            self.assertEqual(challenger_chat['message']['sender']['uid'], str(self.owner.profile.uid))
            self.assertNotIn('created', owner_chat['message'])
            self.assertNotIn('created', challenger_chat['message'])
            message_uid = owner_chat['message']['uid']

            await challenger_socket.disconnect()
            await owner_socket.disconnect()
            return message_uid

        broadcast_message_uid = async_to_sync(scenario)()

        # ensure message persisted
        message = Message.objects.get(
            sender=self.owner.profile,
            room=game.room,
            body='hello everyone',
        )
        self.assertEqual(message.room, game.room)
        self.assertEqual(broadcast_message_uid, str(message.uid))

    def test_unknown_websocket_game_event_returns_error(self) -> None:
        """Unknown game events should return an explicit websocket error."""
        _, game = self.create_game_via_http(self.owner, name='WS Unknown Event')

        async def scenario() -> None:
            communicator = await self._connect_socket(self.owner)

            await communicator.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            response = await self.expect_event(communicator, 'message_history')
            response = await self.expect_event(communicator, 'player_joined')

            await communicator.send_json_to(
                {
                    'target': 'game',
                    'event': 'does_not_exist',
                    'uid': str(game.uid),
                }
            )
            response = await self.expect_event(communicator, 'error')
            self.assertEqual(response['target'], 'game')
            self.assertEqual(response['event'], 'error')
            self.assertEqual(response['message'], 'Unknown game event: does_not_exist')
            await communicator.disconnect()

        async_to_sync(scenario)()
