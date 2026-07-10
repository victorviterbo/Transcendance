"""Tests for the profile module."""

import io
import os
import shutil
from pathlib import Path

from django.conf import settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient
from userauth.models import SiteUser
from userauth.serializers import RegisterSerializer
from userprofile.models import Profile
from userprofile.serializers import LightProfileSerializer, ProfileSerializer

from tests.test_helpers import MEDIA_ROOT, STATIC_ROOT, TestBaseHelpers, TestImageHelpers, urls



import time

class ProfileTests(TestBaseHelpers, TestImageHelpers):
    """Test suit for the user module."""

    def setUp(self) -> None:
        """Set up the common variables for the tests."""
        self.user1 = self.create_user('user1@mail.com', 'user1')
        self.user2 = self.create_user('user2@mail.com', 'user2')
        self.profile = self.create_profile('an_anonymous_user', 12, 'BADGE_DEAF_OCTOPUS')
    
    @classmethod
    def tearDownClass(cls) -> None:
        """Runs once after all tests in this class have finished."""
        shutil.rmtree(MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def tearDown(self) -> None:
        """Runs after EVERY individual test."""
        for root, dirs, files in os.walk(settings.MEDIA_ROOT):
            for f in files:
                Path(root) / Path(f).unlink()
            for d in dirs:
                shutil.rmtree(Path(root) / Path(d))
    
    def test_profile_get(self) -> None:
        """Test success and failure of profile access operation."""
        for query in ['?q=user2', '?q=user1', '?q=an_anonymous_user', '?q=not_a_user', '?q=', '']:
            response = self.client.get(urls['profile'] + query)
            if query in ['?q=user2', '?q=user1', '?q=an_anonymous_user']:
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertStartsWith(response.data['avatar'],
                                      '/static/default_avatars/default_avatar_')
                self.assertIn('username', response.data)
                self.assertIn('exp_points', response.data)
                self.assertIn('badges', response.data)
                self.assertIn('created_at', response.data)
            else:
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('error', response.data)
                self.assertIn('query', response.data['error'])
                if query == '':
                    self.assertEqual('MISSING_FIELD',
                                     response.data['error']['query'])
                elif query in ['?q=', '?q=not_a_user']:
                    self.assertEqual('USER_NOT_FOUND',
                                     response.data['error']['query'])

    def test_profile_post(self) -> None:
        """Test success and failure of profile modification operation."""
        new_data = {
            'username': 'a_new_user',
            'avatar': self.image_generator('valid'),
            'exp_points': 1000000000,
        }
        new_data['avatar'].seek(0)
        response = self.client.post(urls['profile'], data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        login_res = self.client.post(urls['login'], data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        self.assertIn('refresh-token', self.client.cookies)
        new_data = {
            'username': 'a_new_user',
            'email': 'anewemail@mail.com',
            'avatar': self.image_generator('valid'),
            'exp_points': 5001,
            'badges': 'Sonic Shark'
        }
        new_data['avatar'].seek(0)
        response = self.client.post(urls['profile'], data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('email', response.data)
        self.assertEqual(response.data['email'], 'anewemail@mail.com')
        self.assertIn('username', response.data)
        self.assertEqual(response.data['username'], 'a_new_user')

        new_data['avatar'] = self.image_generator('corrupt')
        new_data['avatar'].seek(0)
        response = self.client.post(urls['profile'], data=new_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('avatar', response.data['error'])
        self.assertEqual('INVALID_IMAGE', response.data['error']['avatar'])

        response = self.client.post(urls['profile'], data={'username': 'user2'})
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('username', response.data['error'])
        self.assertEqual('USERNAME_TAKEN', response.data['error']['username'])

        new_data['avatar'] = self.image_generator('corrupt')
        new_data['avatar'].seek(0)
        new_data['username'] = 'user2'
        response = self.client.post(urls['profile'], data=new_data)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('username', response.data['error'])
        self.assertIn('avatar', response.data['error'])
        self.assertEqual('USERNAME_TAKEN', response.data['error']['username'])
        self.assertEqual('INVALID_IMAGE', response.data['error']['avatar'])

        response = self.client.get(urls['profile'] + "?q=a_new_user")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'a_new_user')
        self.assertEqual(response.data['exp_points'], 0)
        self.assertEqual(response.data['badges'], 'BADGE_DEAF_OCTOPUS')
        self.assertTrue(Path(str(MEDIA_ROOT) + response.data['avatar'].removeprefix('/media')).is_file())

    def test_profile_delete(self) -> None:
        """Test profile deletion operation."""
        login_res = self.client.post(urls['login'], data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        response = self.client.post(urls['delete_account'],
                                    data={'password': 'Password123+'})
        self.assertTrue(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Profile.objects.filter(username='user1').exists())
        self.assertFalse(SiteUser.objects.filter(email='user1@mail.com').exists())
        login_res = self.client.post(urls['login'], data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_create_update_delete(self) -> None:
        """Test all profile operation."""
        login_res = self.client.post(urls['login'], data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        username = login_res.data.get('username')
        profile_res = self.client.get(urls['profile'] +'?q='+username)
        image = profile_res.data.get('avatar')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        self.assertIn('refresh-token', self.client.cookies)
        new_data = {
            'username': 'a_new_user',
            'email': 'anewemail@mail.com',
            'avatar': self.image_generator('valid'),
            'exp_points': 5001,
            'badges': 'Sonic Shark'
        }
        new_data['avatar'].seek(0)
        response = self.client.post(urls['profile'], data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        new_data['avatar'].seek(0)
        response = self.client.post(urls['profile'], data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(urls['delete_account'], data={'password': 'Password123+'})
        self.assertTrue(response.status_code, status.HTTP_204_NO_CONTENT)
        login_res = self.client.post(urls['login'], data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Profile.objects.filter(username='user1').exists())
        self.assertFalse(SiteUser.objects.filter(email='user1@mail.com').exists())
        file_path = STATIC_ROOT / image
        time.sleep(1000000)
        self.assertTrue(file_path.exists(), f"File not found at {file_path}")

    def test_guest_profile(self) -> None:
        """Test creation updating and deleting guests users."""
        response = self.client.post(urls['guest_create_url'],
                                    data={'username': 'a_brand_new_guest'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('sessionid', self.client.cookies)
        response = self.client.get(urls['profile_search_url'] + "?q=a_brand_new_guest")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(urls['guest_create_url'], data={'username': 'updating_guest'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(urls['profile_search_url'] + "?q=updating_guest")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        new_data = {
            'username': 'with_a_pic',
            'avatar': self.image_generator('valid'),
            'exp_points': 1000000000,
        }
        new_data['avatar'].seek(0)
        response = self.client.post(urls['guest_create_url'], data=new_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        original_img_path = Path(str(MEDIA_ROOT) + response.data['avatar'].removeprefix('/media'))
        self.assertTrue(original_img_path.is_file())
        self.assertNotIn('exp_points', response.data)

        response = self.client.post(urls['guest_create_url'], data={'username': 'new_username'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(original_img_path.is_file())

        response = self.client.post(urls['guest_delete_url'])
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(original_img_path.is_file())

    def test_profile_validation(self) -> None:
        """Test success and failure of profile validation."""
        raw_data = {
            'username': 'a_new_user',
            'avatar': self.image_generator('valid'),
            'exp_points': '0',
            'badges': 'BADGE_DEAF_OCTOPUS'
        }
        for username in ['a_new_user', 'user1', 'an_anonymous_user', 'asuperlongusernamethatshouldfailbutnotcrash']:
            raw_data['username'] = username
            serializer = ProfileSerializer(data=raw_data, context={'is_creation': True})
            serializer_light = LightProfileSerializer(data=raw_data,
                                                      context={'is_creation': True})
            valid = serializer.is_valid()
            raw_data['avatar'].seek(0)
            valid_light = serializer_light.is_valid()
            raw_data['avatar'].seek(0)
            if username != 'a_new_user':
                self.assertFalse(serializer.is_valid(), serializer.errors)
                self.assertFalse(serializer_light.is_valid(), serializer_light.errors)
                self.assertIn('username', serializer.errors)
                if username in ['user1', 'an_anonymous_user']:
                    self.assertEqual('unique',
                                     serializer.errors['username'][0].code)
                    self.assertEqual('unique',
                                     serializer_light.errors['username'][0].code)
                elif username == 'asuperlongusernamethatshouldfailbutnotcrash':
                    self.assertEqual('max_length',
                                     serializer.errors['username'][0].code)
                    self.assertEqual('max_length',
                                     serializer_light.errors['username'][0].code)
            else:
                self.assertTrue(valid, serializer.errors)
                self.assertTrue(valid_light, serializer_light.errors)
        raw_data['username'] = 'a_new_user'
        for image in self.image_dict:
            raw_data['avatar'] = self.image_generator(image)
            serializer = ProfileSerializer(data=raw_data, context={'is_creation': True})
            serializer_light = LightProfileSerializer(data=raw_data,
                                                      context={'is_creation': True})
            valid = serializer.is_valid()
            raw_data['avatar'].seek(0)
            valid_light = serializer_light.is_valid()
            raw_data['avatar'].seek(0)
            if image != 'valid':
                self.assertFalse(valid, serializer.errors)
                self.assertFalse(valid_light, serializer_light.errors)
                self.assertIn('avatar', serializer.errors)
                self.assertIn('avatar', serializer_light.errors)
                if image in ['invalid', 'corrupt']:
                    self.assertEqual('invalid_image',
                                     serializer.errors['avatar'][0].code)
                    self.assertEqual('invalid_image',
                                     serializer_light.errors['avatar'][0].code)
                elif image == 'empty':
                    self.assertEqual('empty', serializer.errors['avatar'][0].code)
                    self.assertEqual('empty', serializer_light.errors['avatar'][0].code)
            else:
                raw_data['avatar'] = self.image_generator(image)
                raw_data['avatar'].seek(0)
                self.assertTrue(valid, serializer.errors)
                raw_data['avatar'] = self.image_generator(image)
                raw_data['avatar'].seek(0)
                self.assertTrue(valid_light, serializer_light.errors)