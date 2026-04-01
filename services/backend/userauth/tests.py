"""Tests for the authentication user module."""

from rest_framework import status
from rest_framework.test import APITestCase

from .models import SiteUser
from .serializers import RegisterSerializer


class UserAccountTests(APITestCase):
    """Test suit for the user module."""

    def setUp(self) -> None:
        """Set up the common variables for the tests."""
        serializer = RegisterSerializer(data={'email': 'test@mail.com',
                                              'profile_username': 'testuser',
                                              'password': 'Password123+'
                                              },
                                              context={'is_creation': True})
        if serializer.is_valid():
            self.user = serializer.save()

    def test_login_user(self) -> None:
        """Test success and failure of login."""
        url = '/api/auth/login/'
        for email in ['test@mail.com', '', 'test']:
            for password in ['Password123+', '', 'wrongpassword']:
                response = self.client.post(url, {'email': email, 'password': password})
                if email == 'test@mail.com' and password == 'Password123+':
                    self.assertEqual(response.status_code, status.HTTP_200_OK)
                    self.assertNotIn('error', response.data)
                    self.assertIn('access', response.data)
                    self.assertIn('refresh-token', response.cookies)
                else:
                    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
                    self.assertIn('error', response.data)
                    self.assertIn('auth', response.data['error'])
                    self.assertEqual(response.data['error']['auth'],
                                     'INVALID_CREDENTIALS')

    def test_register_user(self) -> None:
        """Test success and failure of user creation."""
        url = '/api/auth/register/'
        for email in ['test@mail.com', '', 'test', 'newuser@mail.com']:
            for username in ['testuser', '', 'newuser']:
                for password in ['AnewPassword1+', '', 'shortpw', 'anewpassword1+',
                                 'AnewPassword+', 'ANEWPASSWORD1+']:
                    data = {'email': email,
                            'username': username,
                            'password': password}
                    response = self.client.post(url, data, format='json')
                    if (email == 'newuser@mail.com' and username == 'newuser' and
                            password == 'AnewPassword1+'):
                        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                        self.assertIn('access', response.data)
                        self.assertIn('username', response.data)
                        self.assertEqual(response.data['username'], username)
                    elif (email == 'test@mail.com' or username == 'testuser' or
                          (email == 'newuser@mail.com' and username == 'newuser'
                           and password != 'AnewPassword1+')):
                        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
                    else:
                        self.assertEqual(response.status_code,
                                         status.HTTP_400_BAD_REQUEST)
                    if email == 'test@mail.com':
                        self.assertEqual('EMAIL_TAKEN',
                                         response.data['error']['email'])
                    if username == 'testuser':
                        self.assertEqual('USERNAME_TAKEN',
                                         response.data['error']['username'])
                    if password in ['', 'test', 'AnewPassword+', 'ANEWPASSWORD1+',
                                    'anewpassword1', 'anewpassword1']:
                        self.assertEqual('INVALID_PASSWORD',
                                         response.data['error']['password'])
                    self.assertTrue(('refresh-token' in self.client.cookies)
                                    or ('sessionid' in self.client.cookies))

    def test_logout(self) -> None:
        """Test success and failure of logout operation."""
        logout_url = '/api/auth/logout/'
        profile_url = '/api/profile/'

        response = self.client.post(profile_url, data={'username': 'should_fail'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        login_res = self.client.post('/api/auth/login/', data={'email': 'test@mail.com',
                                                          'password': 'Password123+'},
                                                          format='json')
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)

        refresh_token_copy = self.client.cookies.get('refresh-token').value

        response = self.client.post(profile_url, data={'username': 'whatever'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(logout_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.cookies.get('refresh-token').value, "")
        self.client.credentials()
        response = self.client.post(profile_url, data={'username': 'should_fail'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.cookies['refresh-token'] = refresh_token_copy
        refresh_response = self.client.post('/api/auth/refresh/')
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'],
                         'Authentication credentials were not provided.')
    
    def test_refresh(self) -> None:
        """Test success and failure of access token regeneration operation."""
        login_url = '/api/auth/login/'
        refresh_url = '/api/auth/refresh/'
        response = self.client.post(refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)
        
        login_res = self.client.post(login_url, {
            'email': "test@mail.com",
            'password': 'Password123+'
        })
        self.assertIn('refresh-token', login_res.cookies)
        self.assertNotIn('refresh-token', login_res.data)
        orig_cookie = login_res.cookies.get('refresh-token').value

        response = self.client.post(refresh_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('username', response.data)
        self.assertEqual('testuser', response.data['username'])
        #test blacklisting
        self.client.cookies['refresh-token'] = orig_cookie
        response = self.client.post(refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
        self.assertNotIn('access', response.data)
        self.assertNotIn('username', response.data)
        self.assertEqual('TOKEN_NOT_VALID', response.data['error']['cookie'])

    def test_user_validation(self) -> None:
        """Test success and failure of user validation."""
        raw_data = {
            "email": "new_user@gmail.com",
            "profile_username": "auniqueuser",
            "password": "securePassword123+"
        }
        serializer = RegisterSerializer(data=raw_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['email'], "new_user@gmail.com")
        user_instance = serializer.save()
        self.assertIsInstance(user_instance, SiteUser)
        self.assertEqual(user_instance.email, "new_user@gmail.com")

        raw_data = {
            "email": "new.1@gmail.com",
            "profile_username": "auniqueuser2",
            "password": "securePassword123+"
        }
        serializer = RegisterSerializer(data=raw_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['email'], "new1@gmail.com")
        user_instance = serializer.save()
        self.assertIsInstance(user_instance, SiteUser)
        self.assertEqual(user_instance.email, "new1@gmail.com")

        i = 0
        for email in ["newuser+1@gmail.com",
                      "+newuser@gmail.com",
                      "....newuser@gmail.com",
                      "new..user@gmail.com"]:
            i = i + 1
            raw_data = {
                "profile_username": "new_user" + str(i),
                "email": email,
                "password": "securePassword123+"
            }
            serializer = RegisterSerializer(data=raw_data)

