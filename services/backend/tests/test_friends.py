"""Tests for the friends module."""

from friends.models import Friendship
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from userauth.serializers import RegisterSerializer
from userprofile.serializers import ProfileSerializer

from tests.test_helpers import TestBaseHelpers, urls


class FriendRequestsTests(TestBaseHelpers, APITestCase):
    """Test suit specifically for friendship requests."""

    def setUp(self) -> None:
        """Set up the common variables for the tests."""
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
                                              'badges': 'BADGE_DEAF_OCTOPUS'
                                            },
                                            context={'is_creation': True})
        if serializer.is_valid():
            self.user3 = serializer.save()

    def test_send_request(self) -> None:
        """Test success and failure of access token regeneration operation."""
        self.authenticate('user1@mail.com')
        response = self.client.get(urls['friend_request'])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incoming']))
        response = self.client.get(urls['friend_request'])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incoming']))

        for user_uid in [self.user1.uid, self.user2.uid]:
            response = self.client.post(urls['friend_request_send'], data={
                        'targetUid': str(user_uid),
                        'targetUsername': 'user2' if user_uid == self.user2.uid else 'user1',
                    })
            if user_uid != self.user2.uid:
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('error', response.data)
                if user_uid == self.user1.uid:
                    self.assertIn('friendship', response.data['error'])
                    self.assertEqual('REALLY_SAD', response.data['error']['friendship'])
                else:
                    self.assertIn('targetUid', response.data['error'])
                    self.assertEqual('USER_NOT_FOUND',
                                     response.data['error']['targetUid'])
            else:
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        response = self.client.get(urls['friend_request'])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(1, len(response.data['outgoing']))
        self.assertEqual(0, len(response.data['incoming']))
        response = self.client.get(urls['friends_list'])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, len(response.data['friends']))
        
        response = self.client.post(urls['friend_request_send'])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('targetUid', response.data['error'])
        self.assertEqual('MISSING_FIELD', response.data['error']['targetUid'])
        response = self.client.post(urls['friend_request_send'], data={
            'targetUid': str(self.user2.uid),
            'targetUsername': self.user2.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('friendship', response.data['error'])
        self.assertEqual('FRIENDSHIP_ALREADY_EXISTS',
                         response.data['error']['friendship'])

    def test_respond_request(self) -> None:
        """Test success and failure of access token regeneration operation."""
        user1 = APIClient()
        user2 = APIClient()
        self.authenticate('user1@mail.com', user1)
        for res in ['refuse', 'accept']:
            for user_uid in [self.user1.uid, self.user2.uid]:
                response = user1.post(urls['friend_request_respond'], data={
                                            'targetUid': str(user_uid),
                                            'targetUsername': 'user2' if user_uid == self.user2.uid else 'user1',
                                            'newStatus': res})
                if user_uid != self.user2.uid:
                    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                    self.assertIn('error', response.data)
                    if user_uid in [self.user1.uid, self.user2.uid]:
                        self.assertIn('friendship', response.data['error'])
                        self.assertEqual('FRIENDSHIP_NOT_FOUND',
                                         response.data['error']['friendship'])
                    else:
                        self.assertIn('targetUid', response.data['error'])
                        self.assertEqual('USER_NOT_FOUND',
                                         response.data['error']['targetUid'])
            response = user1.get(urls['friend_request'])
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(0, len(response.data['outgoing']))
            self.assertEqual(0, len(response.data['incoming']))
            response = user1.post(urls['friend_request_send'], data={
                'targetUid': str(self.user2.uid),
                'targetUsername': self.user2.profile.username,
            })
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

            response = user1.get(urls['friend_request'])
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(1, len(response.data['outgoing']))
            self.assertEqual(str(self.user2.profile.uid),
                             response.data['outgoing'][0]['uid'])
            self.assertEqual(self.user2.profile.username,
                             response.data['outgoing'][0]['username'])
            self.assertEqual('outgoing', response.data['outgoing'][0]['relation'])
            self.assertIn('default_avatars/default_avatar_',
                          response.data['outgoing'][0]['image'])
            self.assertEqual(0, len(response.data['incoming']))

            self.authenticate('user2@mail.com', user2)
            response = user2.post(urls['friend_request_respond'], data={
                'targetUid': str(self.user1.uid),
                'targetUsername': self.user1.profile.username,
                'newStatus': res})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('description', response.data)
            if res == 'accept':
                self.assertEqual('FRIENDSHIP_REQUEST_ACCEPTED',
                                 response.data['description'])
                response = user2.get(urls['friend_request'])
                self.assertEqual(0, len(response.data['outgoing']))
                self.assertEqual(0, len(response.data['incoming']))
                response = user2.get(urls['friends_list'])
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(1, len(response.data['friends']))
                self.assertEqual(str(self.user1.profile.uid),
                                 response.data['friends'][0]['uid'])
                self.assertEqual('online', response.data['friends'][0]['status'])
                self.assertIn('default_avatars/default_avatar_',
                              response.data['friends'][0]['image'])

            elif res == 'refuse':
                self.assertEqual('FRIENDSHIP_REQUEST_REJECTED',
                                 response.data['description'])
                response = user2.get(urls['friend_request'])
                self.assertEqual(0, len(response.data['incoming']))
                self.assertEqual(0, len(response.data['outgoing']))
                response = user2.get(urls['friends_list'])
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(0, len(response.data['friends']))

    def test_search_users(self) -> None:
        """Test the frontend-shaped user search endpoint."""
        self.authenticate('user1@mail.com', self.client)

        response = self.client.post(urls['friend_search'], data={'search': 'user'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('users', response.data)
        self.assertGreaterEqual(len(response.data['users']), 1)
        self.assertIn('relation', response.data['users'][0])
        self.assertIn('default_avatars/default_avatar_',
                      response.data['users'][0]['image'])

    def test_remove_friend_and_cancel_outgoing_request(self) -> None:
        """Test removing accepted friends and canceling outgoing pending requests."""
        self.authenticate('user1@mail.com', self.client)

        response = self.client.post(urls['friend_request_send'], data={
            'targetUid': str(self.user2.uid),
            'targetUsername': self.user2.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(urls['friend_remove'], data={
            'targetUid': str(self.user2.uid),
            'targetUsername': self.user2.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual('FRIENDSHIP_REQUEST_CANCELLED', response.data['description'])
        self.assertFalse(Friendship.objects.filter(from_user=self.user1,
                                                   to_user=self.user2).exists())

        response = self.client.post(urls['friend_request_send'], data={
            'targetUid': str(self.user2.uid),
            'targetUsername': self.user2.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.authenticate('user2@mail.com')

        response = self.client.post(urls['friend_request_respond'], data={
            'targetUid': str(self.user1.uid),
            'targetUsername': self.user1.profile.username,
            'newStatus': 'accept',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.post(urls['friend_remove'], data={
            'targetUid': str(self.user1.uid),
            'targetUsername': self.user1.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual('FRIENDSHIP_REMOVED', response.data['description'])
        self.assertFalse(
            Friendship.objects.filter(
                from_user=self.user1,
                to_user=self.user2,
                status='accepted',
            ).exists()
        )

    def test_remove_does_not_cancel_incoming_request(self) -> None:
        """Test incoming pending requests must still be refused through respond."""
        self.authenticate('user1@mail.com')

        response = self.client.post(urls['friend_request_send'], data={
            'targetUid': str(self.user2.uid),
            'targetUsername': self.user2.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.authenticate('user2@mail.com')
        response = self.client.post(urls['friend_remove'], data={
            'targetUid': str(self.user1.uid),
            'targetUsername': self.user1.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual('FRIENDSHIP_NOT_FOUND', response.data['error']['friendship'])
        self.assertTrue(
            Friendship.objects.filter(
                from_user=self.user1,
                to_user=self.user2,
                status='pending',
            ).exists()
        )

    def test_remove_deleted_target_returns_friendship_not_found(self) -> None:
        """Removing a friend whose account was deleted is a stale friendship state."""

        login_url = '/api/auth/login/'
        send_url = '/api/social/friend-request/send'
        respond_url = '/api/social/friend-request/respond'
        remove_url = '/api/social/friend/remove'

        login_res = self.client.post(login_url, data={'email': 'user1@mail.com', 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data.get('access'))

        target_uid = str(self.user2.profile.uid)
        target_username = self.user2.profile.username
        response = self.client.post(send_url, data={
            'targetUid': target_uid,
            'targetUsername': target_username,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        login_res = self.client.post(login_url, data={'email': 'user2@mail.com', 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data.get('access'))

        response = self.client.post(respond_url, data={
            'targetUid': str(self.user1.profile.uid),
            'targetUsername': self.user1.profile.username,
            'newStatus': 'accept',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user2.delete()
        login_res = self.client.post(login_url, data={'email': 'user1@mail.com', 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data.get('access'))

        response = self.client.post(remove_url, data={
            'targetUid': target_uid,
            'targetUsername': target_username,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual({'friendship': 'FRIENDSHIP_NOT_FOUND'}, response.data['error'])

    def test_friend_mutation_errors_use_canonical_target_uid_only(self) -> None:
        """Friend mutation errors should not include legacy uid aliases."""

        login_url = '/api/auth/login/'
        send_url = '/api/social/friend-request/send'

        login_res = self.client.post(login_url, data={'email': 'user1@mail.com', 'password': 'Password123+'})
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data.get('access'))

        response = self.client.post(send_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual({'targetUid': 'MISSING_FIELD'}, response.data['error'])

        response = self.client.post(send_url, data={
            'targetUid': '00000000-0000-0000-0000-000000000000',
            'targetUsername': 'deleted-user',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual({'targetUid': 'USER_NOT_FOUND'}, response.data['error'])

    def test_notifications_list_and_mark_read(self) -> None:
        """Test the notification payload contract for friend requests and acceptances."""
        self.authenticate('user1@mail.com', self.client)

        response = self.client.post(urls['friend_request_send'], data={
            'targetUid': str(self.user2.uid),
            'targetUsername': self.user2.profile.username,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        friendship = Friendship.objects.get(from_user=self.user1,
                                            to_user=self.user2,
                                            status='pending')

        self.authenticate('user2@mail.com', self.client)

        response = self.client.get(urls['friends_notif'])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(1, len(response.data['notifs']))
        self.assertEqual('friend_request', response.data['notifs'][0]['kind'])
        self.assertEqual(str(friendship.uid), response.data['notifs'][0]['uid'])
        self.assertFalse(response.data['notifs'][0]['read'])
        self.assertEqual(self.user1.profile.username,
                         response.data['notifs'][0]['from']['username'])

        response = self.client.post(urls['friend_request_respond'], data={
            'targetUid': str(self.user1.uid),
            'targetUsername': self.user1.profile.username,
            'newStatus': 'accept',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.authenticate('user1@mail.com', self.client)
        response = self.client.get(urls['friends_notif'])
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(1, len(response.data['notifs']))
        self.assertEqual('friend_accepted', response.data['notifs'][0]['kind'])
        self.assertEqual(str(friendship.uid), response.data['notifs'][0]['uid'])
        self.assertFalse(response.data['notifs'][0]['read'])
