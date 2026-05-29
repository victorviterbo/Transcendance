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


class GameWebsocketFlowTests(GameTestDataMixin, TransactionTestCase):
    """Validate websocket game lifecycle after HTTP creation."""

    def setUp(self) -> None:
        """Set up players for game simulation."""
        self.owner = self.create_user('ws-owner@mail.com', 'ws_owner')
        self.challenger = self.create_user('ws-challenger@mail.com', 'ws_challenger')

    def _connect_socket(self, user: SiteUser) -> WebsocketCommunicator:
        """Connection protocol for user."""
        communicator = WebsocketCommunicator(application, '/ws/global/')
        communicator.scope['user'] = user
        return communicator
    
    def test_multiplayer_full_game_lifecycle(self) -> None:
        """Two players should be able to join, start, and complete a full game loop."""
        _, game = self.create_game_via_http(self.owner, name='WS Full Lifecycle')
        self.seed_game_assets_for_single_round(game)

        async def scenario() -> None:
            async def expect_event(communicator: WebsocketCommunicator,
                                   event_name: str,
                                   timeout: int = 35
									) -> dict:
                payload = await communicator.receive_json_from(timeout=timeout)
                self.assertEqual(payload.get('target'), 'game')
                self.assertEqual(payload.get('event'), event_name, payload.get('messgae'))
                return payload
            
            async def play_round(players: list,
                                player_answer: list,
                                owner: dict,
                                public: bool=False,
                                armageddon: bool=False
								) -> dict:
                payloads = {'start': [],
                            'in_game': [],
                            'end': []}
                for p in players:
                    payload = await expect_event(p, 'round_started')
                    payloads['start'].append(payload)
                for answers in player_answer:
                    await answers['socket'].send_json_to(answers['payload'])
                    if (answers['is_correct'] and armageddon) or (not answers['is_correct'] and public):
                        for p in players:
                            payload = await expect_event(p, answers['expected_response'])
                            payloads['in_game'].append(payload)
                    else:
                        payload = await expect_event(answers['socket'],
                                                     answers['expected_response'])
                        payloads['in_game'].append(payload)
                for p in players:
                    payload = await expect_event(p, 'round_ended')
                    payloads['end'].append(payload)
                return payloads

            owner_socket = self._connect_socket(self.owner)
            owner_connected, _ = await owner_socket.connect()
            self.assertTrue(owner_connected)

            await owner_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            await expect_event(owner_socket, 'player_joined')
            
            challenger_socket = self._connect_socket(self.challenger)
            challenger_connected, _ = await challenger_socket.connect()
            self.assertTrue(challenger_connected)

            await challenger_socket.send_json_to(
                {'target': 'game', 'event': 'join_game', 'uid': str(game.uid)}
            )
            await expect_event(challenger_socket, 'player_joined')
            await expect_event(owner_socket, 'player_joined')

            await owner_socket.send_json_to(
                {
                    'target': 'game',
                    'event': 'update_settings',
                    'uid': str(game.uid),
                    'genres': ['Rock'],
                    'mode': 'armageddon',
                    'trackCount': 4,
                    'playbackDuration': '10',
                    'breakDuration': '5',
                    'fuzzy': True,
                    'reveal': False,
                }
            )
            settings = await expect_event(owner_socket, 'settings_updated')
            #print(json.dumps(settings, indent=4))
            await expect_event(challenger_socket, 'settings_updated')

            await owner_socket.send_json_to(
                {'target': 'game', 'event': 'start_game', 'uid': str(game.uid)}
            )

            await expect_event(owner_socket, 'game_started')
            await expect_event(challenger_socket, 'game_started')
            players = [owner_socket, challenger_socket]
            # ROUND 1 - No one answers
            print("################# ROUND 1 #################")
            payloads = await play_round(players, [], owner_socket, False, True)
            self.assertTrue(payloads['end'])
            #print(json.dumps(payloads, indent=4))
            for i in range(len(players)):
                self.assertEqual(payloads['start'][i]['uid'], str(game.uid))
                self.assertEqual(payloads['start'][i]['playbackDuration'], 10)
                self.assertIsNotNone(payloads['start'][i]['preview'])
            # ROUND 2 - owner give right track
            print("################# ROUND 2 #################")
            answers = [
                {'socket': owner_socket,
                 'payload':{'target': 'game',
                            'event': 'answer_submit',
                            'uid': str(game.uid),
                            'answer': 'Test Track 12',
                            'answerTime': 2,
                            },
                 'expected_response': 'answer_validation',
                 'is_correct' : True
                },
            ]
            payloads = await play_round(players, answers, owner_socket, False, True)
            #print(json.dumps(payloads, indent=4))
            # ROUND 3 - challenger gives right artist, and right title
            print("################# ROUND 3 #################")
            answers = [
                {'socket': challenger_socket,
                 'payload':{'target': 'game',
                            'event': 'answer_submit',
                            'uid': str(game.uid),
                            'answer': 'Test Track 12',
                            'answerTime': 3,
                            },
                 'expected_response': 'answer_validation',
                 'is_correct' : True
                },
                {'socket': challenger_socket,
                 'payload':{'target': 'game',
                            'event': 'answer_submit',
                            'uid': str(game.uid),
                            'answer': 'Test Artist 12',
                            'answerTime': 3,
                            },
                 'expected_response': 'answer_validation',
                 'is_correct' : True
                },
            ]
            payloads = await play_round(players, answers, owner_socket, False, True)
            #print(json.dumps(payloads, indent=4))
            # ROUND 4
            print("################# ROUND 4 #################")
            answers = [
                {'socket': challenger_socket,
                 'payload':{'target': 'game',
                            'event': 'answer_submit',
                            'uid': str(game.uid),
                            'answer': 'wrong answer...',
                            'answerTime': 1,
                            },
                 'expected_response': 'answer_incorrect',
                 'is_correct' : False
                },
                {'socket': owner_socket,
                 'payload':{'target': 'game',
                            'event': 'answer_submit',
                            'uid': str(game.uid),
                            'answer': 'Test Artist 12',
                            'answerTime': 3,
                            },
                 'expected_response': 'answer_validation',
                 'is_correct' : True
                },
                {'socket': owner_socket,
                 'payload':{'target': 'game',
                            'event': 'answer_submit',
                            'uid': str(game.uid),
                            'answer': 'Test Track 12',
                            'answerTime': 3,
                            },
                 'expected_response': 'answer_validation',
                 'is_correct' : True
                },
            ]
            payloads = await play_round(players, answers, owner_socket, False, True)
            #print(json.dumps(payloads, indent=4))

            #self.assertTrue(payloads['end']['is_last_round'])
            #self.assertTrue(payloads['end']['is_last_round'])

            owner_completed = await expect_event(owner_socket, 'game_completed')
            challenger_completed = await expect_event(challenger_socket, 'game_completed')
            self.assertEqual(owner_completed['game']['uid'], str(game.uid))
            self.assertEqual(challenger_completed['game']['uid'], str(game.uid))

            await challenger_socket.disconnect()
            await owner_socket.disconnect()

        async_to_sync(scenario)()

        game.refresh_from_db()
        self.assertEqual(game.status, 'finished')