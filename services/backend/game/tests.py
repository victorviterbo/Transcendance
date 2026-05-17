"""Tests for game HTTP endpoints and websocket flow."""

import uuid
from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from friends.models import Friendship
from music.models import Track
from project.asgi import application
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userauth.serializers import RegisterSerializer

from .models import Game
from .ws_game_db_helpers import _setup_game_assets


class GameTestDataMixin:
    """Shared setup and helper functions for game tests."""

    def create_user(self, email: str, username: str):
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

    def create_game_via_http(
        self,
        user,
        *,
        game_name: str,
        public_level: str = 'public',
    ) -> tuple[dict, Game]:
        client = APIClient()
        client.force_login(user)
        response = client.post(
            '/api/game/',
            {
                'game_name': game_name,
                'public_level': public_level,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        game = Game.objects.get(uid=response.data['uid'])
        return response.data, game

    def seed_game_assets_for_single_round(self, game: Game) -> None:
        """Attach one playable track, room, and playlist so a full game loop can run."""
        Track.objects.create(
            itunes_id=900001,
            title='Shallow Waters',
            artist='The Testers',
            genre='Pop',
            preview_url='https://example.com/track.mp3',
        )
        game.genres = ['Pop']
        game.num_tracks = 1
        game.playback_duration = timedelta(seconds=5)
        game.break_duration = timedelta(seconds=0)
        game.save(
            update_fields=['genres', 'num_tracks', 'playback_duration', 'break_duration']
        )
        #_setup_game_assets(game)


class GameHTTPViewTests(GameTestDataMixin, APITestCase):
    """Validate game HTTP endpoints and creation contract."""

    def setUp(self) -> None:
        self.owner = self.create_user('owner@mail.com', 'game_owner')
        self.friend = self.create_user('friend@mail.com', 'game_friend')
        self.stranger = self.create_user('stranger@mail.com', 'game_stranger')
        self.client.force_login(self.owner)

    def test_create_game_with_required_payload_only(self) -> None:
        """Game creation should only require game_name and public_level."""
        response = self.client.post(
            '/api/game/',
            {
                'game_name': 'Friday Quiz',
                'public_level': 'public',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn('uid', response.data)
        self.assertEqual(response.data['game_name'], 'Friday Quiz')
        self.assertEqual(response.data['public_level'], 'public')

        game = Game.objects.get(uid=response.data['uid'])
        self.assertEqual(game.game_name, 'Friday Quiz')
        self.assertEqual(game.owned_by, self.owner.profile)
        self.assertTrue(game.players.filter(id=self.owner.profile.id).exists())

    def test_create_game_missing_game_name_returns_structured_error(self) -> None:
        """Missing required fields should use normalized error codes."""
        response = self.client.post(
            '/api/game/',
            {'public_level': 'public'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {'error': {'game_name': 'REQUIRED_GAME_NAME'}})

    def test_create_game_invalid_public_level_returns_structured_error(self) -> None:
        """Invalid public_level values should return an explicit validation code."""
        response = self.client.post(
            '/api/game/',
            {'game_name': 'Bad Level', 'public_level': 'everyone'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {'error': {'public_level': 'INVALID_CHOICE_PUBLIC_LEVEL'}},
        )

    def test_list_endpoint_returns_only_public_games(self) -> None:
        """General listing endpoint should expose only public games."""
        public_game = Game.objects.create(
            game_name='Public Match',
            public_level='public',
            owned_by=self.owner.profile,
        )
        private_game = Game.objects.create(
            game_name='Friends Match',
            public_level='friends_only',
            owned_by=self.owner.profile,
        )

        response = self.client.get('/api/game/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_uids = {entry['uid'] for entry in response.data}
        self.assertIn(str(public_game.uid), returned_uids)
        self.assertNotIn(str(private_game.uid), returned_uids)

    def test_friends_endpoint_returns_only_friends_owned_games(self) -> None:
        """Friends listing should include only friends' friends_only games."""
        Friendship.objects.create(
            from_user=self.owner,
            to_user=self.friend,
            status='accepted',
        )
        friend_game = Game.objects.create(
            game_name='Friend Match',
            public_level='friends_only',
            owned_by=self.friend.profile,
        )
        stranger_game = Game.objects.create(
            game_name='Stranger Match',
            public_level='friends_only',
            owned_by=self.stranger.profile,
        )

        response = self.client.get('/api/game/friends/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_uids = {entry['uid'] for entry in response.data}
        self.assertIn(str(friend_game.uid), returned_uids)
        self.assertNotIn(str(stranger_game.uid), returned_uids)

    def test_single_game_get_returns_game_payload(self) -> None:
        """Single game endpoint should return a game by UID."""
        game = Game.objects.create(
            game_name='Single Lookup',
            public_level='public',
            owned_by=self.owner.profile,
        )

        response = self.client.get(f'/api/game/{game.uid}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['uid'], str(game.uid))
        self.assertEqual(response.data['game_name'], 'Single Lookup')


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
        _, game = self.create_game_via_http(self.owner, game_name='WS Settings')

        async def scenario() -> None:
            communicator = self._connect_socket(self.owner)
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            await communicator.send_json_to(
                {
                    'target': 'game',
                    'event': 'update_settings',
                    'uid': str(game.uid),
                    'genres': ['Pop', 'Rock'],
                    'game_mode': 'speed',
                    'num_tracks': 6,
                    'playback_duration': '00:00:20',
                    'break_duration': '00:00:05',
                    'fuzzy_match': False,
                    'answer_public': True,
                }
            )
            response = await communicator.receive_json_from()
            self.assertEqual(response['target'], 'game')
            self.assertEqual(response['event'], 'settings_updated')
            self.assertEqual(response['settings']['genres'], ['Pop', 'Rock'])
            self.assertEqual(response['settings']['game_mode'], 'speed')
            self.assertEqual(response['settings']['num_tracks'], 6)
            await communicator.disconnect()

        async_to_sync(scenario)()

        game.refresh_from_db()
        self.assertEqual(game.genres, ['Pop', 'Rock'])
        self.assertEqual(game.game_mode, 'speed')
        self.assertEqual(game.num_tracks, 6)
        self.assertEqual(game.fuzzy_match, False)
        self.assertEqual(game.answer_public, True)

    def test_websocket_settings_validation_error_is_structured(self) -> None:
        """Invalid settings over websocket should return the normalized error format."""
        _, game = self.create_game_via_http(self.owner, game_name='WS Validation')

        async def scenario() -> None:
            communicator = self._connect_socket(self.owner)
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

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
        _, game = self.create_game_via_http(self.owner, game_name='WS Join')

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
            challenger_ack = await challenger_socket.receive_json_from()
            owner_broadcast = await owner_socket.receive_json_from()

            self.assertEqual(challenger_ack['target'], 'game')
            self.assertEqual(challenger_ack['event'], 'player_joined')
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
        _, game = self.create_game_via_http(self.owner, game_name='WS Unknown Event')

        async def scenario() -> None:
            communicator = self._connect_socket(self.owner)
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

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

    def test_multiplayer_full_game_lifecycle(self) -> None:
        """Two players should be able to join, start, and complete a full game loop."""
        _, game = self.create_game_via_http(self.owner, game_name='WS Full Lifecycle')
        self.seed_game_assets_for_single_round(game)

        async def scenario() -> None:
            async def expect_event(communicator: WebsocketCommunicator,
                                   event_name: str,
                                   timeout: int = 35
									) -> dict:
                payload = await communicator.receive_json_from(timeout=timeout)
                print(payload)
                self.assertEqual(payload.get('target'), 'game')
                self.assertEqual(payload.get('event'), event_name)
                return payload

            owner_socket = self._connect_socket(self.owner)
            owner_connected, _ = await owner_socket.connect()
            self.assertTrue(owner_connected)

            challenger_socket = self._connect_socket(self.challenger)
            challenger_connected, _ = await challenger_socket.connect()
            self.assertTrue(challenger_connected)

            """await owner_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            await expect_event(owner_socket, 'player_joined')"""

            await challenger_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            await expect_event(challenger_socket, 'player_joined')
            await expect_event(owner_socket, 'player_joined')

            await owner_socket.send_json_to(
                {'target': 'game', 'event': 'start_game', 'uid': str(game.uid)}
            )

            owner_round_start = await expect_event(owner_socket, 'round_started')
            challenger_round_start = await expect_event(challenger_socket, 'round_started')
            self.assertEqual(owner_round_start['game']['uid'], str(game.uid))
            self.assertEqual(challenger_round_start['game']['uid'], str(game.uid))
            
            challenger_round_end = await expect_event(challenger_socket, 'round_end')

            owner_round_end = await expect_event(owner_socket, 'round_end')
            self.assertTrue(owner_round_end['is_last_round'])
            self.assertTrue(challenger_round_end['is_last_round'])

            owner_completed = await expect_event(owner_socket, 'game_completed')
            challenger_completed = await expect_event(challenger_socket, 'game_completed')
            self.assertEqual(owner_completed['game']['uid'], str(game.uid))
            self.assertEqual(challenger_completed['game']['uid'], str(game.uid))

            await challenger_socket.disconnect()
            await owner_socket.disconnect()

        async_to_sync(scenario)()

        game.refresh_from_db()
        self.assertEqual(game.status, 'finished')