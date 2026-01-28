from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import SiteUser

class UserAccountTests(APITestCase):
    def setUp(self):
        self.user = SiteUser.objects.create_user(email = "test@mail.com", username="testuser", password="password123")

    def test_login_user_success(self):
        """Ensure we can log in a user."""
        url = '/api/users/login/'
        data = {'email': 'test@mail.com', 'password': 'password123'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        #self.assertIn('access', response.data) # Check if JWT token is returned

    def test_login_user_fail(self):
        url = '/api/users/login/'
        data = {'email': 'test@mail.com', 'password': 'password'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_register_success(self):
        url = '/api/users/register/'
        data = {'email': 'newuser@mail.com', 'password': 'password', 'username': 'newuser'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        #self.assertIn('access', response.data) # Check if JWT token is returned

    def test_register_user_fail(self):
        url = '/api/users/register/'
        data = {'email' : 'test@mail.com', 'username': 'testuser', 'password': "password123"}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    
    def test_profile_success(self):
        self.client.force_authenticate(user=self.user)
        url = '/api/users/profile/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_profile_fail(self):
        url = '/api/users/profile/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.force_authenticate(user=None)


"""from rest_framework.authtoken.models import Token

def test_profile_with_token(self):
    # 1. Create user and token
    user = SiteUser.objects.create_user(email="token@gmail.com", password="password123")
    token = Token.objects.create(user=user)
    
    # 2. Add the header exactly like your React app would
    self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
    
    response = self.client.get('/api/profile/')
    self.assertEqual(response.status_code, status.HTTP_200_OK)"""