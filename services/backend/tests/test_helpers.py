"""Shared test setup and helper functions for multiple test modules."""

import io
import json
import os
import random
import shutil
import uuid
from pathlib import Path

from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import AsyncClient, override_settings
from game.models import Game
from music.models import Track
from PIL import Image
from project.asgi import application
from project.defaults import genres
from rest_framework import status
from rest_framework.test import (
    APITestCase,
    APITransactionTestCase,
)
from userauth.models import SiteUser
from userauth.serializers import RegisterSerializer
from userprofile.models import Profile
from userprofile.serializers import ProfileSerializer

urls = {
    'login': '/api/auth/login/',
    'logout': '/api/auth/logout/',
    'refresh': '/api/auth/refresh/',
    'pw_change': '/api/auth/password/',
    'game': '/api/game/',
    'friend_game': '/api/game/friends/',
    'delete_account': '/api/auth/delete/',
    'register': '/api/auth/register/',
    'profile': '/api/profile/',
    'guest_create_url': '/api/profile/guest-create/',
    'guest_delete_url': '/api/profile/guest-delete/',
    'profile_search_url': '/api/profile/search/',
    'friend_request': '/api/social/friends-request/',
    'friend_request_send': '/api/social/friend-request/send/',
    'friend_request_respond': '/api/social/friend-request/respond/',
    'friend_remove': '/api/social/friend/remove/',
    'friends_list': '/api/social/friends/',
    'friend_search': '/api/social/friends-search/',
    'friends_notif': '/api/social/notifs/',
    'direct_chat': '/api/chat/direct/',
}

MEDIA_ROOT = settings.MEDIA_ROOT / 'tests_tmp/'
STATIC_ROOT = settings.STATIC_ROOT

class TestBaseHelpers:
    """Shared setup and helper functions for game tests."""

    def create_user(self, email: str, username: str) -> SiteUser:
        """Create a new user for tests."""
        serializer = RegisterSerializer(
            data={'email': email,
                  'password': 'Password123+',
                  'profile_username': username},
            context={'is_creation': True}
        )
        serializer.is_valid(raise_exception=True)
        return serializer.save()


    def create_profile(self,
                       username: str,
                       exp_points: str = '12',
                       badges: str = 'BADGE_DEAF_OCTOPUS') -> Profile:
        """Create a new profile for tests."""
        serializer = ProfileSerializer(
            data={'username': username, 'exp_points': exp_points, 'badges': badges},
            context={'is_creation': True}
        )
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    def authenticate(self, email: str, client=None, password: str='Password123+') -> None:
        """Authenticate a user and set credentials for future requests."""
        if client is None:
            client = self.client
        login_res = client.post(urls['login'], data={'email': email,
                                                      'password': password})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access = login_res.data.get('access')
        client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
        return

    def create_game_via_http(self,
                                user: SiteUser,
                                name: str,
                                visibility: str = 'public',
                                ) -> tuple[dict, Game]:
        """self.owner will create a new game via http."""
        self.authenticate(user.email)
        response = self.client.post(
            urls['game'],
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

@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class TestImageHelpers(APITransactionTestCase):
    """Shared setup and helper functions for image-related tests."""
    
    image_dict = {
        'valid': '',
        'invalid': b'this is just a text string, not an image',
        'empty': b'',
        'corrupt': b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00'
    }
    def image_generator(self, image_type: str) -> SimpleUploadedFile:
        """Helper function to generate images for tests."""
        if image_type == 'valid':
            file_obj = io.BytesIO()
            image = Image.new('RGB', size=(1000, 1000), color=(0, 0, 255))
            image.save(file_obj, 'png')
            file_obj.seek(0)
            img_content = file_obj.getvalue()
        else:
            img_content = self.image_dict.get(image_type)
        return SimpleUploadedFile(name='large_test.png',
                                    content=img_content,
                                    content_type='image/png'
                                    )

class TestWebsocketHelpers(APITransactionTestCase):
    """Shared setup and helper functions for websocket game tests."""

    async def _connect_socket(self, user) -> WebsocketCommunicator:
        communicator = WebsocketCommunicator(application, '/ws/global/')
        communicator.scope['user'] = user
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        return communicator
    
    async def expect_event(self, communicator: WebsocketCommunicator,
                                   event_name: str,
                                   timeout: int = 35
									) -> dict:
        """Wait for a specific event from the game socket and return its payload."""
        payload = await communicator.receive_json_from(timeout=timeout)
        self.assertEqual(payload.get('target'), 'game')
        if payload.get('event') != event_name:
            self.fail(f'Expected event "{event_name}", \
                      but got "{payload.get("event")}". \
                        Payload: {json.dumps(payload, indent=4)}')
        self.assertEqual(payload.get('event'), event_name, payload.get('messgae'))
        return payload
    
    async def play_round(self,
                         players: list,
                         player_answer: list,
                         owner: dict,
                         public: bool=False,
                        ) -> dict:
        """Handle a game round."""
        payloads = {'preview': [],
                    'start': [],
                    'in_game': [],
                    'end': []}
        for p in players:
            payload = await self.expect_event(p, 'round_preview')
            payloads['preview'].append(payload)
        for p in players:
            payload = await self.expect_event(p, 'round_started')
            payloads['start'].append(payload)
        for answers in player_answer:
            await answers['socket'].send_json_to(answers['payload'])
            for p in players:
                payload = await self.expect_event(p, 'answer_broadcast')
                payloads['end'].append(payload)
                self.assertTrue(not public or payload.get('answer') is None, True)
            if not answers['is_correct'] and public:
                for p in players:
                    payload = await self.expect_event(p, answers['expected_response'])
                    payloads['in_game'].append(payload)
            else:
                payload = await self.expect_event(answers['socket'],
                                                answers['expected_response'])
                payloads['in_game'].append(payload)
            
        for p in players:
            payload = await self.expect_event(p, 'round_ended')
            payloads['end'].append(payload)
        return payloads
    
