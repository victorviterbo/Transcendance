"""Tests for the users module."""


from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userprofile.serializers import ProfileSerializer

from .models import SiteUser
from .serializers import SiteUserSerializer


class UserAccountTests(APITestCase):
    """Test suit for the user module."""

    def setUp(self) -> None:
        """Set up the common variables for the tests."""
        serializer = SiteUserSerializer(data={'email': 'test@mail.com',
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
                    self.assertEqual(response.data['error']['auth'], 'AUTH_FAIL')

    def test_register_user(self) -> None:
        """Test success and failure of user creation."""
        url = '/api/auth/register/'
        for email in ['test@mail.com', '', 'test', 'newuser@mail.com']:
            for username in ['testuser', '', 'newuser']:
                for password in ['AnewPassword1+', '', 'shortpw', 'anewpassword1+', 'AnewPassword+', 'ANEWPASSWORD1+']:
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
                        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                    if email == 'test@mail.com':
                        self.assertEqual('ALREADY_TAKEN',
                                         response.data['error']['email'])
                    if username == 'testuser':
                        self.assertEqual('ALREADY_TAKEN',
                                         response.data['error']['username'])
                    if email in ['', 'test']:
                        self.assertEqual('INVALID',
                                         response.data['error']['email'])
                    if username == '':
                        self.assertEqual('INVALID',
                                         response.data['error']['username'])
                    if password == 'AnewPassword+':
                        self.assertEqual('PASSWORD_NUMBER',
                                         response.data['error']['password'])
                    if password == 'ANEWPASSWORD1+':
                        self.assertEqual('PASSWORD_LOWERCASE',
                                         response.data['error']['password'])
                    if password == 'anewpassword1':
                        self.assertEqual('PASSWORD_UPPERCASE',
                                         response.data['error']['password'])
                    if password == 'anewpassword1':
                        self.assertEqual('PASSWORD_SPECIAL',
                                         response.data['error']['password'])

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
        response = self.client.post(refresh_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('username', response.data)
        self.assertEqual('testuser', response.data['username'])

    def test_user_validation(self) -> None:
        """Test success and failure of user validation."""
        raw_data = {
            "email": "new_user@gmail.com",
            "profile_username": "auniqueuser",
            "password": "securePassword123+"
        }
        serializer = SiteUserSerializer(data=raw_data)
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
        serializer = SiteUserSerializer(data=raw_data)
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
            serializer = SiteUserSerializer(data=raw_data)


class FriendRequestsTests(APITestCase):
    """Test suit specifically for friendship requests."""

    def setUp(self) -> None:
        """Set up the common variables for the tests."""
        self.client = APIClient()
        serializer = SiteUserSerializer(data={'email': 'user1@mail.com',
                                              'profile_username': 'user1',
                                              'password': 'Password123+'},
                                              context={'is_creation': True})
        if serializer.is_valid():
            self.user1 = serializer.save()
        serializer = SiteUserSerializer(data={'email': 'user2@mail.com',
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

    def test_send_request(self) -> None:
        """Test success and failure of access token regeneration operation."""
        friend_request_url = '/api/auth/friend-request/send/'
        login_url = '/api/auth/login/'
        friend_request_see_url = '/api/auth/friend-request/'
        friend_see_url = '/api/auth/friends/'
        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        
        response = self.client.get(friend_request_see_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incomming']))
        response = self.client.get(friend_request_see_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incomming']))

        for target_username in ['user1', 'user2', 'an_anonymous_user', 'not_a_user', '']:
            response = self.client.post(friend_request_url, data={
                'target-username': target_username})
            if target_username != 'user2':
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('error', response.data)
                if target_username == 'user1':
                    self.assertIn('friendship', response.data['error'])
                    self.assertEqual('REALLY_SAD', response.data['error']['friendship'])
                elif target_username in ['an_anonymous_user', '']:
                    self.assertIn('target-username', response.data['error'])
                    self.assertEqual('NOT_FOUND',
                                     response.data['error']['target-username'])
            else:
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        response = self.client.get(friend_request_see_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(1, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incomming']))

        response = self.client.get(friend_see_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['friends']))
        
        response = self.client.post(friend_request_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('target-username', response.data['error'])
        self.assertEqual('MISSING_FIELD', response.data['error']['target-username'])
        response = self.client.post(friend_request_url, data={
            'target-username': 'user2'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('friendship', response.data['error'])
        self.assertEqual('ALREADY_EXISTS', response.data['error']['friendship'])

    def test_respond_request(self) -> None:
        """Test success and failure of access token regeneration operation."""
        friend_respond_url = '/api/auth/friend-request/respond/'
        friend_request_url = '/api/auth/friend-request/send/'
        friend_request_see_url = '/api/auth/friend-request/'
        friend_see_url = '/api/auth/friends/'
        login_url = '/api/auth/login/'
        user1 = APIClient()
        user2 = APIClient()
        login_res = user1.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        user1.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        
        for res in ['reject', 'accept']:
            for target_username in ['user1', 'user2', 'an_anonymous_user', 'not_a_user', '']:
                response = user1.post(friend_respond_url, data={
                                            'target-username': target_username,
                                            'new-status': res})
                if target_username != 'user2':
                    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                    self.assertIn('error', response.data)
                    if target_username in ['user1', 'user2']:
                        self.assertIn('friendship', response.data['error'])
                        self.assertEqual('NOT_FOUND',
                                         response.data['error']['friendship'])
                    elif target_username in ['an_anonymous_user', '']:
                        self.assertIn('target-username', response.data['error'])
                        self.assertEqual('NOT_FOUND',
                                         response.data['error']['target-username'])
            
            login_res = user1.post(login_url, data={'email': 'user1@mail.com',
                                                    'password': 'Password123+'})
            self.assertEqual(login_res.status_code, status.HTTP_200_OK)
            access_token = login_res.data.get('access')
            user1.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
            response = user1.get(friend_request_see_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(0, len(response.data['outgoing']))
            self.assertEqual(0, len(response.data['incomming']))

            response = user1.post(friend_request_url, data={
                'target-username': 'user2'})
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

            response = user1.get(friend_request_see_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(1, len(response.data['outgoing']))
            self.assertEqual('user1', response.data['outgoing'][0]['from_user'])
            self.assertEqual('user2', response.data['outgoing'][0]['to_user'])
            self.assertEqual('pending', response.data['outgoing'][0]['status'])
            self.assertEqual(0, len(response.data['incomming']))

            login_res = user2.post(login_url, data={'email': 'user2@mail.com',
                                                    'password': 'Password123+'})
            self.assertEqual(login_res.status_code, status.HTTP_200_OK)
            access_token = login_res.data.get('access')
            user2.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
            response = user2.post(friend_respond_url, data={
                'target-username': 'user1', 'new-status': res})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('description', response.data)
            if res == 'accept':
                self.assertEqual('REQUEST_ACCEPTED', response.data['description'])
                response = user2.get(friend_request_see_url)
                self.assertEqual(0, len(response.data['outgoing']))
                self.assertEqual(0, len(response.data['incomming']))
                response = user2.get(friend_see_url)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(1, len(response.data['friends']))

            elif res == 'reject':
                self.assertEqual('REQUEST_REJECTED', response.data['description'])
                response = user2.get(friend_request_see_url)
                self.assertEqual(0, len(response.data['incomming']))
                self.assertEqual(0, len(response.data['outgoing']))
                response = user2.get(friend_see_url)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(0, len(response.data['friends']))
    