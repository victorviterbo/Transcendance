"""Tests for the users module."""

from rest_framework import status
from rest_framework.test import APITestCase

from .models import SiteUser


class UserAccountTests(APITestCase):
    """Test suit for the user module."""

    def setUp(self) -> None:
        """Set up the common variables for the tests."""
        self.user = SiteUser.objects.create_user(email = "test@mail.com",
                                                 username="testuser",
                                                 password="password123")

    def test_login_user(self) -> None:
        """Test success and failure of login."""
        url = '/api/auth/login/'
        for email in ['test@mail.com', '', 'test']:
            for password in ['password123', '', 'wrongpassword']:
                data = {'email': email, 'password': password}
                response = self.client.post(url, data, format='json')
                if email == 'test@mail.com' and password == 'password123':
                    self.assertEqual(response.status_code, status.HTTP_200_OK)
                    self.assertNotIn('error', response.data)
                    self.assertIn('access', response.data)
                    self.assertIn('refresh-token', response.cookies)
                else:
                    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
                    self.assertIn('error', response.data)
                    self.assertEqual(response.data['error'], 'Wrong email or password')

    def test_register_user_fail(self) -> None:
        """Test success and failure of user creation."""
        url = '/api/auth/register/'
        for email in ['test@mail.com', '', 'test', 'newuser@mail.com']:
            for username in ['testuser', '', 'newuser']:
                data = {'email': email,
                        'username': username,
                        'password': 'SomePassword123'}
                response = self.client.post(url, data, format='json')
                if email == 'test@mail.com' or username == 'testuser':
                    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
                elif email == 'newuser@mail.com' and username == 'newuser':
                    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                if email != 'newuser@mail.com':
                    self.assertIn('error', response.data)
                    self.assertIn('email', response.data['error'])
                    if email == 'test@mail.com':
                        self.assertEqual(response.data['error']['email'],
                                         'Email already taken')
                    else:
                        self.assertEqual(response.data['error']['email'],
                                         'Invalid Email')
                elif username != 'newuser':
                    self.assertIn('error', response.data)
                    self.assertIn('username', response.data['error'])
                    if username == 'testuser':
                        self.assertEqual(response.data['error']['username'],
                                         'Username already taken')
                    else:
                        self.assertEqual(response.data['error']['username'],
                                         'Invalid Username')

    def test_logout(self) -> None:
        """Test success and failure of logout operation."""
        logout_url = '/api/auth/logout/'
        profile_url = '/api/auth/profile/'

        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        login_res = self.client.post('/api/auth/login/', {'email': 'test@mail.com',
                                                          'password': 'password123'})
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION=access_token)

        refresh_token_copy = self.client.cookies.get('refresh-token').value

        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(logout_url)
        self.assertEqual(response.data['detail'], 'Successfully logged out.')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.cookies.get('refresh-token').value, "")
        self.client.credentials()
        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.cookies['refresh-token'] = refresh_token_copy
        refresh_response = self.client.post('/api/auth/refresh/')
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_profile_success(self) -> None:
        """Test success and failure of profile access operation."""
        login_res = self.client.post('/api/auth/login/', {'email': 'test@mail.com',
                                                          'password': 'password123'})
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION=access_token)
        url = '/api/auth/profile/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['image'], '/DB/media/default.jpg')
        
        url = '/api/auth/profile/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.force_authenticate(user=None)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_success(self) -> None:
        """Test success and failure of access token regeneration operation."""
        login_url = '/api/auth/login/'
        refresh_url = '/api/auth/refresh/'
        response = self.client.post(refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)
        
        login_res = self.client.post(login_url, {
            'email': "test@mail.com",
            'password': 'password123'
        })
        self.assertIn('refresh-token', login_res.cookies)
        response = self.client.post(refresh_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
