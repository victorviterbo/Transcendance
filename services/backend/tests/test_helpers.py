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
from django.test import TransactionTestCase, override_settings
from friends.models import Friendship
from music.models import Track
from PIL import Image
from project.asgi import application
from project.defaults import genres
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userauth.models import SiteUser
from userauth.serializers import RegisterSerializer
from userprofile.models import Game, Profile
from userprofile.serializers import LightProfileSerializer, ProfileSerializer


class TestBaseHelpers(APITestCase):
    """Shared setup and helper functions for game tests."""


    image_dict = {
        'valid': '',
        'invalid': b'this is just a text string, not an image',
        'empty': b'',
        'corrupt': b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00'
    }

    def create_user(self, email: str, username: str) -> SiteUser:
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

    def create_profile(self, username: str, exp_points: str = '12',
                       badges: str = 'BADGE_DEAF_OCTOPUS') -> Profile:
        """Create a new profile for tests."""
        serializer = ProfileSerializer(
            data={'username': username, 'exp_points': exp_points, 'badges': badges},
            context={'is_creation': True}
        )
        serializer.is_valid(raise_exception=True)
        return serializer.save()

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

    def authenticate(self, email: str, password: str='Password123!') -> None:
        """Authenticate a user and set credentials for future requests."""
        login_url = '/api/auth/login/'
        login_res = self.client.post(login_url, data={'email': email,
                                                      'password': password})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access)
        return

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