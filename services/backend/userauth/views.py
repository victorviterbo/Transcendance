"""Defines the views relatives to user registration, login, password change etc."""
from typing import Any

from django.contrib.auth import authenticate
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from userprofile.models import Profile
from userprofile.serializers import validate_username
from .models import Friendship, SiteUser
from .serializers import FriendshipSerializer, LoginSerializer, SiteUserSerializer


class LoginView(APIView):
    """Define the login page."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Handles login request.
        
        Args:
            request:
                payload: {email, password}

        Returns:
            Response:
                200: {access}
                    Set-Cookie: refresh token to get a new access token when the
                                current expires
                401: {error}
        """
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Wrong email or password'},
                        status=status.HTTP_401_UNAUTHORIZED)
        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        user = authenticate(email=email, password=password)

        if user is not None:
            try:
                token = RefreshToken.for_user(user)
                response = Response({'username': user.username,
                                     'access': str(token.access_token)},
                                    status=status.HTTP_200_OK)
                response.set_cookie(
                    key='refresh-token',
                    value=str(token),
                    httponly=True, secure=True, samesite='Lax',
                    path='/api/auth/'
                )
                return response
            except ValueError:
                return Response({'error': 'Wrong email or password'},
                         status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': 'Wrong email or password'},
                        status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(APIView):
    """Define the register page."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Handles user registration request.
        
        Args:
            request:
                payload: {username, email, password}

        Returns:
            Response:
                201: {description}
                400: {error{email, username}}
        """
        try:
            renamed_data = request.data.copy()
            renamed_data['profile_username'] = renamed_data.pop('username')
            serializer = SiteUserSerializer(data=renamed_data, context={'is_creation': True})
            if serializer.is_valid(raise_exception=True):
                serializer.save(profile_username=request.data.get('username'))
                token = RefreshToken.for_user(serializer.instance)
                response = Response({'username':  serializer.instance.profile.username,
                                     'access': str(token.access_token)},
                                     status=status.HTTP_201_CREATED)
                response.set_cookie(
                    key='refresh-token',
                    value=str(token),
                    httponly=True, secure=True, samesite='Lax',
                    path='/api/auth/'
                )
                return response
        except serializers.ValidationError as e:
            error = e.get_full_details()
            error_response = {'error':{}}
            response_code = status.HTTP_400_BAD_REQUEST
            if error.get('email'):
                if any(['unique' in e['code'] for e in error['email']]):
                    error_response['error']['email'] = 'Email already taken'
                    response_code = status.HTTP_409_CONFLICT
                else:
                    error_response['error']['email'] = 'Invalid Email'
            if error.get('profile_username'):
                if any(['unique' in e['code'] for e in error['profile_username']]):
                    error_response['error']['username'] = 'Username already taken'
                    response_code = status.HTTP_409_CONFLICT
                else:
                    error_response['error']['username'] = 'Invalid Username'
            return Response(error_response, status=response_code)

class LogoutView(APIView):
    """Define lougout operation view."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Handles display of user profile.
        
        Args:
            request:
                Header: [Authorization]

        Returns:
            Response:
                200: {image}
                400: {error{email, username}}
        """
        refresh_token = request.COOKIES.get('refresh-token')
        
        if not refresh_token:
            response = Response(status=status.HTTP_204_NO_CONTENT)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({'error': 'Not authenticated'},
                            status=status.HTTP_401_UNAUTHORIZED)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(
            'refresh-token',
            samesite='Lax',
            path='/api/auth/'
        )
        return response
    
    
class RefreshTokenView(TokenRefreshView):
    """Define generation of new access token operation view."""
    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Handles display of user profile.
        
        Args:
            request:
                Cookie: [refresh token]
            args: additional arguments that might be needed by the parent class
            kwargs: additional arguments that might be needed by the parent class

        Returns:
            Response:
                200: {image}
                400: {error{email, username}}
        """
        refresh_token = request.COOKIES.get('refresh-token')
        
        if refresh_token:
            request.data['refresh'] = refresh_token
            try:
                response = super().post(request, *args, **kwargs)
                if response.status_code == status.HTTP_200_OK:
                    new_refresh = response.data.get('refresh')
                    token = RefreshToken(new_refresh)
                    user = SiteUser.objects.get(id=token['user_id'])
                    
                    response.data['username'] = user.username
                    response.set_cookie(
                        key='refresh-token',
                        value=new_refresh,
                        httponly=True, secure=True, samesite='Lax',
                        path='/api/auth/'
                    )
                    return response
                else:
                    return response
            except Exception as e:
                return Response({'description': f'Refresh token invalid: {e}'},
                                status=status.HTTP_401_UNAUTHORIZED)
        return Response({'description': 'Refresh token not found in cookies'},
                        status=status.HTTP_401_UNAUTHORIZED)


class FriendRequests(APIView):
    """Define all functions related to sending seeing and accepting friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Create new friend requests."""
        target = request.data.get("target-username")
        if target is None:
            return (Response({'error': 'no target specified'},
                             status=status.HTTP_400_BAD_REQUEST))
        target_user = SiteUser.object.filter(username=target)
        if target_user.count() < 1:
            return (Response({'error': 'no matching user',
                              'requested': request.data.get("target-username")},
                              status=status.HTTP_400_BAD_REQUEST))
        elif target_user.count() > 1:
            return (Response({'error': 'more than one user match request',
                              'requested': request.data.get("target-username")},
                              status=status.HTTP_400_BAD_REQUEST))
        else:
            recipient = target_user.first()
            sender = request.user
            if sender == recipient:
                return Response({'error': 'I feel bad for you'}, 
                                status=status.HTTP_400_BAD_REQUEST)
            curr_relationship = Friendship.objects.filter(
                from_user=sender, 
                to_user=recipient
            )
            curr_rev_relationship = Friendship.objects.filter(
                from_user=recipient, 
                to_user=sender
            )
            if (curr_rev_relationship.exists() and curr_rev_relationship.status == 'pending'):
                curr_rev_relationship.first().status = 'accepted'
                return Response({'description': 'Friendship created'}, 
                                status=status.HTTP_202_ACCEPTED)
            if curr_relationship.exists():
                if curr_relationship.status == 'pending':
                    return Response({'error': 'Friendship request already send',
                                    'request_status': curr_relationship.status},
                                    status=status.HTTP_400_BAD_REQUEST)
                elif curr_relationship.status == 'accepted':
                    return Response({'error': 'Friendship already exists',
                                    'request_status': curr_relationship.status},
                                    status=status.HTTP_400_BAD_REQUEST)
            
            Friendship.objects.create(
                from_user=sender,
                to_user=recipient,
                status='pending'
            )
            return Response({'description': f'Friend request sent to {target}'}, 
                            status=status.HTTP_201_CREATED)

    def get(self, request: Request) -> Response:
        """List all friend requests for user."""
        incomming_req = Friendship.objects.filter(to_user=request.user,
                                                  status='pending')
        outgoing_req = Friendship.objects.filter(from_user=request.user,
                                                 status='pending')
        response_data = {}
        response_data['incomming'] = FriendshipSerializer(incomming_req, many=True)
        response_data['outgoing'] = FriendshipSerializer(outgoing_req, many=True)
        return Response(response_data, status=status.HTTP_200_OK)

