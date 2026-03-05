"""Tests for the profile module."""

import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase
from userauth.serializers import SiteUserSerializer
from .models import Profile
from .serializers import LightProfileSerializer, ProfileSerializer
from pathlib import Path

class ProfileTests(APITestCase):
    """Test suit for the user module."""

    def setUp(self) -> None:
        """Set up the common variables for the tests."""
        serializer = SiteUserSerializer(data={'email': 'user1@mail.com',
                                              'profile_username': 'user1',
                                              'password': 'Password123+'},
                                              context={'is_creation': True})
        if serializer.is_valid():
            self.user = serializer.save()
        serializer = SiteUserSerializer(data={'email': 'user2@mail.com',
                                              'profile_username': 'user2',
                                              'password': 'Password123+'},
                                              context={'is_creation': True})
        if serializer.is_valid():
            self.user = serializer.save()
        
        serializer = ProfileSerializer(data= {'username': 'an_anonymous_user',
                                              'exp_points': '12',
                                              'badges': 'Deaf Octopus'
                                            },
                                            context={'is_creation': True})
        if serializer.is_valid():
            self.user = serializer.save()

    def test_profile_get(self) -> None:
        """Test success and failure of profile access operation."""
        profile_url = '/api/profile/'
        for username in ['user2', 'user1', 'an_anonymous_user', 'not_a_user', '']:
            profile_query = '?q=' + username
            response = self.client.get(profile_url + profile_query)
            if username in ['user2', 'user1', 'an_anonymous_user']:
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data['image'], '/DB/media/default_pp.jpg')
            else:
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('error', response.data)
                if username:
                    self.assertEqual('No profile with this username', response.data['error'])
                else:
                    self.assertEqual('Invalid empty query string', response.data['error'])
        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual('Query string not found', response.data['error'])

    def test_profile_post(self) -> None:
        """Test success and failure of profile modification operation."""
        login_url = '/api/auth/login/'
        profile_url = '/api/profile/'
        img_path = Path(__file__).parent.parent / 'DB' / 'media' / 'image.png'
        image_bytes = img_path.read_bytes()
        image_io = io.BytesIO(image_bytes)
        image_io.seek(0)
        fake_file = SimpleUploadedFile(
            name=img_path.name, 
            content=image_io.read(), 
            content_type='image/png'
        )
        new_data = {
            'username': 'a_new_user',
            'image': fake_file,
            'exp_points': 1000000000,
        }
        response = self.client.post(profile_url, data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION=access_token)

        image_io.seek(0)
        fake_file = SimpleUploadedFile(
            name=img_path.name, 
            content=image_io.read(), 
            content_type='image/png'
        )
        new_data = {
            'username': 'a_new_user',
            'image': fake_file,
            'exp_points': 1000000000,
        }
        response = self.client.post(profile_url, data=new_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(profile_url + "?q=a_new_user")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'a_new_user')
        self.assertStartsWith(response.data['image'], '/DB/media/profile_pics/image')

    def test_profile_validation(self) -> None:
        """Test success and failure of profile validation."""
        file_obj = io.BytesIO()
        image = Image.new('RGB', size=(1000, 1000), color=(0, 0, 255))
        image.save(file_obj, 'png')
        file_obj.seek(0)
        valid_image = SimpleUploadedFile(
            name='large_test.png',
            content=file_obj.read(),
            content_type='image/png'
        )
        raw_data = {
            'username': 'a_new_user',
            'image': valid_image,
            'exp_points': '0',
            'badges': 'Deaf Octopus'
        }
        invalid_image = SimpleUploadedFile(
            name='fake_image.jpg',
            content=b'this is just a text string, not an image',
            content_type='image/jpeg'
        )
        empty_file = SimpleUploadedFile(
            name='empty.png',
            content=b'',
            content_type='image/png'
        )
        corrupt_image = SimpleUploadedFile(
            name='corrupt.png',
            content=b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00',
            content_type='image/png'
        )
        for username in ['a_new_user', 'user1', 'an_anonymous_user', 'asuperlongusernamethatshouldfailbutnotcrash']:
            raw_data['username'] = username
            serializer = ProfileSerializer(data=raw_data, context={'is_creation': True})
            serializer_light = LightProfileSerializer(data=raw_data, context={'is_creation': True})
            if username != 'a_new_user':
                self.assertFalse(serializer.is_valid(), serializer.errors)
                self.assertFalse(serializer_light.is_valid(), serializer_light.errors)
                self.assertIn('username', serializer.errors)
                if username in ['user1', 'an_anonymous_user']:
                    self.assertEqual('unique', serializer.errors['username'][0].code)
                    self.assertEqual('unique', serializer_light.errors['username'][0].code)
                elif username == 'asuperlongusernamethatshouldfailbutnotcrash':
                    self.assertEqual('max_length', serializer.errors['username'][0].code)
                    self.assertEqual('max_length', serializer_light.errors['username'][0].code)
            else:
                self.assertTrue(serializer.is_valid(), serializer.errors)
                self.assertTrue(serializer_light.is_valid(), serializer_light.errors)
        raw_data['username'] = 'a_new_user'
        for image in [valid_image, invalid_image, empty_file, corrupt_image]:
            raw_data['image'] = image
            serializer = ProfileSerializer(data=raw_data, context={'is_creation': True})
            serializer_light = LightProfileSerializer(data=raw_data, context={'is_creation': True})
            if image is not valid_image:
                self.assertFalse(serializer.is_valid(), serializer.errors)
                self.assertFalse(serializer_light.is_valid(), serializer_light.errors)
                self.assertIn('image', serializer.errors)
                self.assertIn('image', serializer_light.errors)
                if image in [invalid_image, corrupt_image]:
                    self.assertEqual('invalid_image', serializer.errors['image'][0].code)
                    self.assertEqual('invalid_image', serializer_light.errors['image'][0].code)
                elif image is empty_file:
                    self.assertEqual('empty', serializer.errors['image'][0].code)
                    self.assertEqual('empty', serializer_light.errors['image'][0].code)
            else:
                self.assertTrue(serializer.is_valid(), serializer.errors)
                self.assertTrue(serializer_light.is_valid(), serializer_light.errors)
        
        raw_data['image'] = valid_image
        for exp_points in [0, 1234, -120, 'a', '']:
            raw_data['exp_points'] = exp_points
            serializer = ProfileSerializer(data=raw_data, context={'is_creation': True})
            serializer_light = LightProfileSerializer(data=raw_data, context={'is_creation': True})
            self.assertTrue(serializer_light.is_valid(), serializer_light.errors)
            if exp_points in ['a', '']:
                self.assertFalse(serializer.is_valid(), serializer.errors)
                self.assertIn('exp_points', serializer.errors)
                self.assertEqual('invalid', serializer.errors['exp_points'][0].code)
            else:
                self.assertTrue(serializer.is_valid(), serializer.errors)
        
        raw_data['exp_points'] = 0
        for badges in ['Deaf Octopus', 'not a badge', '']:
            raw_data['badges'] = badges
            serializer = ProfileSerializer(data=raw_data, context={'is_creation': True})
            serializer_light = LightProfileSerializer(data=raw_data, context={'is_creation': True})
            self.assertTrue(serializer_light.is_valid(), serializer_light.errors)
            if badges != 'Deaf Octopus':
                self.assertFalse(serializer.is_valid(), serializer.errors)
                self.assertIn('badges', serializer.errors)
                self.assertEqual('invalid_choice', serializer.errors['badges'][0].code)
            else:
                self.assertTrue(serializer.is_valid(), serializer_light.errors)
