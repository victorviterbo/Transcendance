"""Tests for the friends module."""

from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userauth.serializers import RegisterSerializer
from userprofile.serializers import ProfileSerializer


class FriendRequestsTests(APITestCase):
    """Test suit specifically for friendship requests."""

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

    def test_send_request(self) -> None:
        """Test success and failure of access token regeneration operation."""
        friend_request_url = '/api/social/friend-request/send'
        login_url = '/api/auth/login/'
        friend_request_see_url = '/api/social/friends-request'
        friend_see_url = '/api/social/friends'
        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        
        response = self.client.get(friend_request_see_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incoming']))
        response = self.client.get(friend_request_see_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incoming']))

        for user_uid in [self.user1.uid, self.user2.uid]: #, self.user1.profile.uid
            response = self.client.post(friend_request_url, data={
                        'target-uid': str(user_uid),
                        'target-username': 'user2' if user_uid == self.user2.uid else 'user1',
                    })
            if user_uid != self.user2.uid:
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('error', response.data)
                if user_uid == self.user1.uid:
                    self.assertIn('friendship', response.data['error'])
                    self.assertEqual('REALLY_SAD', response.data['error']['friendship'])
                else:
                    self.assertIn('user_uid', response.data['error'])
                    self.assertEqual('USER_NOT_FOUND',
                                     response.data['error']['user_uid'])
            else:
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(friend_request_see_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(1, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incoming']))
        response = self.client.get(friend_see_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['friends']))
        
        response = self.client.post(friend_request_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('target-uid', response.data['error'])
        self.assertEqual('MISSING_FIELD', response.data['error']['target-uid'])
        response = self.client.post(friend_request_url, data={
            'target-uid': str(self.user2.uid),
            'target-username': self.user2.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('friendship', response.data['error'])
        self.assertEqual('FRIENDSHIP_ALREADY_EXISTS',
                         response.data['error']['friendship'])

    def test_respond_request(self) -> None:
        """Test success and failure of access token regeneration operation."""
        friend_respond_url = '/api/social/friend-request/respond'
        friend_request_url = '/api/social/friend-request/send'
        friend_request_see_url = '/api/social/friends-request'
        friend_see_url = '/api/social/friends'
        login_url = '/api/auth/login/'
        user1 = APIClient()
        user2 = APIClient()
        login_res = user1.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        user1.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        
        for res in ['refuse', 'accept']:
            for user_uid in [self.user1.uid, self.user2.uid]: #, 'abc123', ''
                response = user1.post(friend_respond_url, data={
                                            'target-uid': str(user_uid),
                                            'target-username': 'user2' if user_uid == self.user2.uid else 'user1',
                                            'new-status': res})
                if user_uid != self.user2.uid:
                    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                    self.assertIn('error', response.data)
                    if user_uid in [self.user1.uid, self.user2.uid]:
                        self.assertIn('friendship', response.data['error'])
                        self.assertEqual('FRIENDSHIP_NOT_FOUND',
                                         response.data['error']['friendship'])
                    else:
                        self.assertIn('target-uid', response.data['error'])
                        self.assertEqual('USER_NOT_FOUND',
                                         response.data['error']['target-uid'])
            
            login_res = user1.post(login_url, data={'email': 'user1@mail.com',
                                                    'password': 'Password123+'})
            self.assertEqual(login_res.status_code, status.HTTP_200_OK)
            access_token = login_res.data.get('access')
            user1.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
            response = user1.get(friend_request_see_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(0, len(response.data['outgoing']))
            self.assertEqual(0, len(response.data['incoming']))

            response = user1.post(friend_request_url, data={
                'target-uid': str(self.user2.uid),
                'target-username': self.user2.profile.username,
            })
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

            response = user1.get(friend_request_see_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(1, len(response.data['outgoing']))
            self.assertEqual(str(self.user2.profile.uid), response.data['outgoing'][0]['uid'])
            self.assertEqual(self.user2.profile.username, response.data['outgoing'][0]['username'])
            self.assertEqual('outgoing', response.data['outgoing'][0]['relation'])
            self.assertIn('default_avatars/default_avatar_', response.data['outgoing'][0]['image'])
            self.assertEqual(0, len(response.data['incoming']))

            login_res = user2.post(login_url, data={'email': 'user2@mail.com',
                                                    'password': 'Password123+'})
            self.assertEqual(login_res.status_code, status.HTTP_200_OK)
            access_token = login_res.data.get('access')
            user2.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
            response = user2.post(friend_respond_url, data={
                'target-uid': str(self.user1.uid),
                'target-username': self.user1.profile.username,
                'new-status': res})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('description', response.data)
            if res == 'accept':
                self.assertEqual('FRIENDSHIP_REQUEST_ACCEPTED',
                                 response.data['description'])
                response = user2.get(friend_request_see_url)
                self.assertEqual(0, len(response.data['outgoing']))
                self.assertEqual(0, len(response.data['incoming']))
                response = user2.get(friend_see_url)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(1, len(response.data['friends']))
                self.assertEqual(str(self.user1.profile.uid), response.data['friends'][0]['uid'])
                self.assertEqual('online', response.data['friends'][0]['status'])
                self.assertIn('default_avatars/default_avatar_', response.data['friends'][0]['image'])

            elif res == 'refuse':
                self.assertEqual('FRIENDSHIP_REQUEST_REJECTED',
                                 response.data['description'])
                response = user2.get(friend_request_see_url)
                self.assertEqual(0, len(response.data['incoming']))
                self.assertEqual(0, len(response.data['outgoing']))
                response = user2.get(friend_see_url)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(0, len(response.data['friends']))

    def test_search_users(self) -> None:
        """Test the frontend-shaped user search endpoint."""

        login_url = '/api/auth/login/'
        search_url = '/api/social/friends-search'
        login_res = self.client.post(login_url, data={'email': 'user1@mail.com',
                                                 'password': 'Password123+'})

        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)

        response = self.client.post(search_url, data={'search': 'user'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('users', response.data)
        self.assertGreaterEqual(len(response.data['users']), 1)
        self.assertIn('relation', response.data['users'][0])
        self.assertIn('default_avatars/default_avatar_', response.data['users'][0]['image'])

    def test_notifications_list_and_mark_read(self) -> None:
        """Test the notification drawer endpoints."""

        login_url = '/api/auth/login/'
        send_url = '/api/social/friend-request/send'
        notifs_url = '/api/social/notifs'
        notifs_read_url = '/api/social/notifs_read'

        login_res = self.client.post(login_url, data={'email': 'user1@mail.com', 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data.get('access'))

        response = self.client.post(send_url, data={
            'target-uid': str(self.user2.uid),
            'target-username': self.user2.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        login_res = self.client.post(login_url, data={'email': 'user2@mail.com', 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data.get('access'))

        response = self.client.get(notifs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(1, len(response.data['notifs']))
        self.assertEqual('friend-request', response.data['notifs'][0]['kind'])
        self.assertFalse(response.data['notifs'][0]['read'])
        self.assertEqual(self.user1.profile.username, response.data['notifs'][0]['from']['username'])

        response = self.client.post(notifs_read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.get(notifs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(1, len(response.data['notifs']))
        self.assertTrue(response.data['notifs'][0]['read'])
    