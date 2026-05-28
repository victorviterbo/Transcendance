"""Tests for game HTTP endpoints and websocket flow."""

import json
import random
import uuid

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from friends.models import Friendship
from music.models import Track
from project.asgi import application
from project.defaults import genres
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userauth.models import SiteUser
from userauth.serializers import RegisterSerializer

from .models import Game


class GameTestDataMixin:
    """Shared setup and helper functions for game tests."""

    def create_user(self, email: str, username: str):
        """Create a new user for tests."""
        serializer = RegisterSerializer(
            data={
                'email': email,
                'profile_username': username,
                'password': 'Password123!',
            },
            context={'is_creation': True},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        return serializer.save()

    def create_game_via_http(self,
                             user: SiteUser,
                             name: str,
                             visibility: str = 'public',
                             ) -> tuple[dict, Game]:
        """self.owner will create a new game via http."""
        client = APIClient()
        login_url = '/api/auth/login/'
        login_res = client.post(login_url, data={'email': user.email,
                                                 'password': 'Password123!'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access = login_res.data.get('access')
        client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
        response = client.post(
            '/api/game/',
            {
                'name': name,
                'visibility': visibility,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        game = Game.objects.get(uid=response.data['uid'])
        return response.data, game
    

    def seed_game_assets_for_single_round(self, game: Game) -> None:
        """Attach one playable track, room, and playlist so a full game loop can run."""
        for i in range(0, 100):
            Track.objects.create(
                itunes_id=900001 + i,
                title=f'Test Track {i}',
                artist=f'Test Artist {i}',
                genre=random.choice(genres),
                preview_url='https://example.com/track.mp3',
            )
        """game.genres = ['Pop']
        game.trackCount = 1
        game.playbackDuration= 5
        game.breakDuration= 0
        game.save(
            update_fields=['genres', 'trackCount', 'playbackDuration', 'breakDuration']
        )"""
        #_setup_game_assets(game)


class GameHTTPViewTests(GameTestDataMixin, APITestCase):
    """Validate game HTTP endpoints and creation contract."""

    def setUp(self) -> None:
        self.owner = self.create_user('owner@mail.com', 'game_owner')
        self.friend = self.create_user('friend@mail.com', 'game_friend')
        self.stranger = self.create_user('stranger@mail.com', 'game_stranger')
        login_url = '/api/auth/login/'
        login_res = self.client.post(login_url, data={'email': 'owner@mail.com',
                                                 'password': 'Password123!'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)

    def test_create_game_with_required_payload_only(self) -> None:
        """Game creation should only require name and visibility."""
        login_url = '/api/auth/login/'
        login_res = self.client.post(login_url, data={'email': 'owner@mail.com',
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
        login_url = '/api/auth/login/'
        login_res = self.client.post(login_url, data={'email': 'owner@mail.com',
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


class GameWebsocketFlowTests(GameTestDataMixin, TransactionTestCase):
    """Validate websocket game lifecycle after HTTP creation."""

    def setUp(self) -> None:
        self.owner = self.create_user('ws-owner@mail.com', 'ws_owner')
        self.challenger = self.create_user('ws-challenger@mail.com', 'ws_challenger')

    def _connect_socket(self, user) -> WebsocketCommunicator:
        communicator = WebsocketCommunicator(application, '/ws/global/')
        communicator.scope['user'] = user
        return communicator

    def test_join_game_rejects_unknown_game_uid(self) -> None:
        """join_game should fail when the target game does not exist."""

        async def scenario() -> None:
            communicator = self._connect_socket(self.challenger)
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

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
            communicator = self._connect_socket(self.owner)
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            await communicator.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            response = await communicator.receive_json_from()
            self.assertEqual(response['event'], 'player_joined')

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
            response = await communicator.receive_json_from()
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
            communicator = self._connect_socket(self.owner)
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            await communicator.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            response = await communicator.receive_json_from()
            print("lala")
            print(response)
            self.assertEqual(response['event'], 'player_joined')

            await communicator.send_json_to(
                {
                    'target': 'game',
                    'event': 'update_settings',
                    'uid': str(game.uid),
                    'genres': ['Metal'],
                }
            )
            response = await communicator.receive_json_from()
            self.assertEqual(response['target'], 'game')
            self.assertEqual(response['event'], 'error')
            self.assertEqual(response['error'], {'genres': 'INVALID_GENRES'})
            await communicator.disconnect()

        async_to_sync(scenario)()

    def test_join_game_broadcasts_new_player(self) -> None:
        """A challenger joining should notify existing members and persist membership."""
        _, game = self.create_game_via_http(self.owner, name='WS Join')

        async def scenario() -> None:
            owner_socket = self._connect_socket(self.owner)
            owner_connected, _ = await owner_socket.connect()
            self.assertTrue(owner_connected)

            challenger_socket = self._connect_socket(self.challenger)
            challenger_connected, _ = await challenger_socket.connect()
            self.assertTrue(challenger_connected)

            await owner_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            owner_first_message = await owner_socket.receive_json_from()
            self.assertEqual(owner_first_message['event'], 'player_joined')

            await challenger_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            challenger_join_response = await challenger_socket.receive_json_from()
            owner_broadcast = await owner_socket.receive_json_from()

            self.assertEqual(challenger_join_response['target'], 'game')
            self.assertEqual(challenger_join_response['event'], 'player_joined')
            self.assertEqual(owner_broadcast['target'], 'game')
            self.assertEqual(owner_broadcast['event'], 'player_joined')
            self.assertEqual(owner_broadcast['player']['uid'],
                             str(self.challenger.profile.uid))

            await challenger_socket.disconnect()
            await owner_socket.disconnect()

        async_to_sync(scenario)()

        game.refresh_from_db()
        self.assertTrue(game.players.filter(id=self.challenger.profile.id).exists())

    def test_unknown_websocket_game_event_returns_error(self) -> None:
        """Unknown game events should return an explicit websocket error."""
        _, game = self.create_game_via_http(self.owner, name='WS Unknown Event')

        async def scenario() -> None:
            communicator = self._connect_socket(self.owner)
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            await communicator.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            response = await communicator.receive_json_from()
            self.assertEqual(response['event'], 'player_joined')

            await communicator.send_json_to(
                {
                    'target': 'game',
                    'event': 'does_not_exist',
                    'uid': str(game.uid),
                }
            )
            response = await communicator.receive_json_from()
            self.assertEqual(response['target'], 'game')
            self.assertEqual(response['event'], 'error')
            self.assertEqual(response['message'], 'Unknown game event: does_not_exist')
            await communicator.disconnect()

        async_to_sync(scenario)()
