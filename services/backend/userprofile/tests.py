"""Tests for the profile module."""

import io
import os
import shutil
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TransactionTestCase, override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient
from userauth.models import SiteUser
from userauth.serializers import RegisterSerializer

from .models import Profile
from .serializers import LightProfileSerializer, ProfileSerializer

image_dict = {
    'valid': '',
    'invalid': b'this is just a text string, not an image',
    'empty': b'',
    'corrupt': b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00'
}

def image_generator(image_type: str) -> SimpleUploadedFile:
    """Helper function to generate images for tests."""
    if image_type == 'valid':
        file_obj = io.BytesIO()
        image = Image.new('RGB', size=(1000, 1000), color=(0, 0, 255))
        image.save(file_obj, 'png')
        file_obj.seek(0)
        img_content = file_obj.getvalue()
    else:
        img_content = image_dict.get(image_type)
    return SimpleUploadedFile(name='large_test.png',
                                content=img_content,
                                content_type='image/png'
                                )

MEDIA_ROOT = settings.MEDIA_ROOT / 'tests_tmp/'

@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class ProfileTests(TransactionTestCase):
    """Test suit for the user module."""

    def setUp(self) -> None:
        """Set up the common variables for the tests."""
        self.client = APIClient()
        serializer = RegisterSerializer(data={'email': 'user1@mail.com',
                                              'profile_username': 'user1',
                                              'password': 'Password123+'},
                                              context={'is_creation': True})
        if serializer.is_valid():
            self.user1 = serializer.save()
        serializer = RegisterSerializer(data={'email': 'user2@mail.com',
                                              'profile_username': 'user2',
                                              'password': 'Password123+'},
                                              context={'is_creation': True})
        if serializer.is_valid():
            self.user2 = serializer.save()
        
        serializer = ProfileSerializer(data={'username': 'an_anonymous_user',
                                              'exp_points': '12',
                                              'badges': 'Deaf Octopus'
                                            },
                                            context={'is_creation': True})
        if serializer.is_valid():
            self.user3 = serializer.save()
    
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
        profile_url = '/api/profile/'
        for query in ['?q=user2', '?q=user1', '?q=an_anonymous_user', '?q=not_a_user', '?q=', '']:
            profile_query =  query
            response = self.client.get(profile_url + profile_query)
            if query in ['?q=user2', '?q=user1', '?q=an_anonymous_user']:
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertStartsWith(response.data['avatar'],
                                      '/DB/static/default_avatars/default_avatar_')
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
        login_url = '/api/auth/login/'
        profile_url = '/api/profile/'
        new_data = {
            'username': 'a_new_user',
            'avatar': image_generator('valid'),
            'exp_points': 1000000000,
        }
        new_data['avatar'].seek(0)
        response = self.client.post(profile_url, data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        self.assertIn('refresh-token', self.client.cookies)
        new_data = {
            'username': 'a_new_user',
            'email': 'anewemail@mail.com',
            'avatar': image_generator('valid'),
            'exp_points': 5001,
            'badge': 'Sonic Shark'
        }
        new_data['avatar'].seek(0)
        response = self.client.post(profile_url, data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('email', response.data)
        self.assertEqual(response.data['email'], 'anewemail@mail.com')
        self.assertIn('username', response.data)
        self.assertEqual(response.data['username'], 'a_new_user')

        new_data['avatar'] = image_generator('corrupt')
        new_data['avatar'].seek(0)
        response = self.client.post(profile_url, data=new_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('avatar', response.data['error'])
        self.assertEqual('INVALID_IMAGE', response.data['error']['avatar'])

        response = self.client.post(profile_url, data={'username': 'user2'})
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('username', response.data['error'])
        self.assertEqual('USERNAME_TAKEN', response.data['error']['username'])

        new_data['avatar'] = image_generator('corrupt')
        new_data['avatar'].seek(0)
        new_data['username'] = 'user2'
        response = self.client.post(profile_url, data=new_data)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('error', response.data)
        self.assertIn('username', response.data['error'])
        self.assertIn('avatar', response.data['error'])
        self.assertEqual('USERNAME_TAKEN', response.data['error']['username'])
        self.assertEqual('INVALID_IMAGE', response.data['error']['avatar'])

        response = self.client.get(profile_url + "?q=a_new_user")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'a_new_user')
        self.assertEqual(response.data['exp_points'], 0)
        self.assertEqual(response.data['badges'], 'Deaf Octopus')
        print(response.data['avatar'])
        print(str(Path(MEDIA_ROOT / response.data['avatar'].removeprefix('/DB/static/'))))
        self.assertTrue(Path(MEDIA_ROOT / response.data['avatar'].removeprefix('/DB/static/')).is_file())
    
    def test_profile_delete(self) -> None:
        """Test profile deletion operation."""
        login_url = '/api/auth/login/'
        account_delete_url = '/api/auth/delete/'

        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        response = self.client.post(account_delete_url, data={'password': 'Password123+'})
        self.assertTrue(response.status_code, status.HTTP_204_NO_CONTENT)
        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Profile.objects.filter(username='user1').exists())
        self.assertFalse(SiteUser.objects.filter(email='user1@mail.com').exists())

    def test_profile_create_update_delete(self) -> None:
        """Test all profile operation."""
        login_url = '/api/auth/login/'
        profile_url = '/api/profile/'
        account_delete_url = '/api/auth/delete/'

        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        username = login_res.data.get('username')
        profile_res = self.client.get(profile_url+'?q='+username)
        image = profile_res.data.get('avatar')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        self.assertIn('refresh-token', self.client.cookies)
        new_data = {
            'username': 'a_new_user',
            'email': 'anewemail@mail.com',
            'avatar': image_generator('valid'),
            'exp_points': 5001,
            'badge': 'Sonic Shark'
        }
        new_data['avatar'].seek(0)
        response = self.client.post(profile_url, data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(account_delete_url, data={'password': 'Password123+'})
        self.assertTrue(response.status_code, status.HTTP_204_NO_CONTENT)
        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(Profile.objects.filter(username='user1').exists())
        self.assertFalse(SiteUser.objects.filter(email='user1@mail.com').exists())

        file_path = Path("./" + image)
        print(file_path)
        print(os.listdir(file_path.parent))
        self.assertTrue(file_path.exists(), f"File not found at {file_path}")


    def test_guest_profile(self) -> None:
        """Test creation updating and deleting guests users."""
        guest_create_url = '/api/profile/guest-create/'
        guest_delete_url = '/api/profile/guest-delete/'
        profile_search_url = '/api/profile/search/'
        response = self.client.post(guest_create_url,
                                    data={'username': 'a_brand_new_guest'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('sessionid', self.client.cookies)
        response = self.client.get(profile_search_url + "?q=a_brand_new_guest")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(guest_create_url, data={'username': 'updating_guest'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.get(profile_search_url + "?q=updating_guest")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        new_data = {
            'username': 'with_a_pic',
            'avatar': image_generator('valid'),
            'exp_points': 1000000000,
        }
        new_data['avatar'].seek(0)
        response = self.client.post(guest_create_url, data=new_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        original_img_path = Path(MEDIA_ROOT / response.data['avatar'].removeprefix('/DB/static/'))
        self.assertTrue(original_img_path.is_file())
        self.assertNotIn('exp_points', response.data)

        response = self.client.post(guest_create_url, data={'username': 'new_username'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(original_img_path.is_file())

        response = self.client.post(guest_delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(original_img_path.is_file())

    def test_profile_validation(self) -> None:
        """Test success and failure of profile validation."""
        raw_data = {
            'username': 'a_new_user',
            'avatar': image_generator('valid'),
            'exp_points': '0',
            'badges': 'Deaf Octopus'
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
        for image in image_dict:
            raw_data['avatar'] = image_generator(image)
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
                raw_data['avatar'] = image_generator(image)
                raw_data['avatar'].seek(0)
                self.assertTrue(valid, serializer.errors)
                raw_data['avatar'] = image_generator(image)
                raw_data['avatar'].seek(0)
                self.assertTrue(valid_light, serializer_light.errors)