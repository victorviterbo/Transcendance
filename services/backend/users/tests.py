from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from rest_framework import status
from .models import SiteUser

class UserAccountTests(APITestCase):
    def setUp(self):
        self.user = SiteUser.objects.create_user(email = "test@mail.com", username="testuser", password="password123")

    def test_login_user_success(self):
        """Ensure we can log in a user."""
        url = '/api/auth/login/'
        data = {'email': 'test@mail.com', 'password': 'password123'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('username', response.data)
        self.assertIn('refresh-token', response.cookies)

    def test_login_user_fail(self):
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
    
    def test_register_success(self):
        url = '/api/auth/register/'
        data = {'email': 'newuser@mail.com', 'password': 'password', 'username': 'newuser'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Uncomment if we login user as he registers
        #self.assertIn('access', response.data)
        #self.assertIn('username', response.data)

    def test_register_user_fail(self):
        url = '/api/auth/register/'
        for email in ['test@mail.com', '', 'test', 'newuser@mail.com']:
            for username in ['testuser', '', 'newuser']:
                data = {'email': email, 'username': username, 'password': 'SomePassword123'}
                response = self.client.post(url, data, format='json')
                if email == 'test@mail.com' or username == 'testuser':
                    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
                elif email == 'newuser@mail.com' and username == 'newuser':
                    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                if email != 'newuser@mail.com':
                    self.assertIn('error', response.data)
                    if response.status_code is not status.HTTP_409_CONFLICT:
                        self.assertIn('email', response.data['error'])
                    if email == 'test@mail.com':
                        self.assertEqual(response.data['error']['email'], 'Email already taken')
                    else :
                        self.assertEqual(response.data['error']['email'], 'Invalid Email')

                elif username != 'newuser':
                    self.assertIn('error', response.data)
                    self.assertIn('username', response.data['error'])
                    if username == 'testuser':
                        self.assertEqual(response.data['error']['username'], 'Username already taken')
                    else :
                        self.assertEqual(response.data['error']['username'], 'Invalid Username')

    def test_profile_success(self):
        self.client.force_authenticate(user=self.user)
        url = '/api/auth/profile/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['image'], '/DB/media/default.jpg')
    
    def test_profile_fail(self):
        url = '/api/auth/profile/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.force_authenticate(user=None)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_success(self):
        login_url = '/api/auth/login/'
        refresh_url = '/api/auth/refresh/'
        login_res = self.client.post(login_url, {
            'email': "test@mail.com",
            'password': 'password123'
        })
        self.assertIn('refresh-token', login_res.cookies)
        response = self.client.post(refresh_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_fail(self):
        refresh_url = '/api/auth/refresh/'
        response = self.client.post(refresh_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)