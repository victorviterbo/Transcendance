"""Defines the views relatives to user registration, login, password change etc."""
from typing import Any

from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from userprofile.serializers import LightProfileSerializer

from .models import Friendship, SiteUser
from .serializers import FriendshipSerializer, LoginSerializer, SiteUserSerializer


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
            serializer = SiteUserSerializer(data=renamed_data,
                                            context={'is_creation': True})
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
                if any(['unique' in e['code'].lower() for e in error['email']]):
                    error_response['error']['email'] = 'ALREADY_TAKEN'
                    response_code = status.HTTP_409_CONFLICT
                else:
                    error_response['error']['email'] = 'INVALID'
            if error.get('profile_username'):
                if any(['unique' in e['code'].lower() for e in error['profile_username']]):
                    error_response['error']['username'] = 'ALREADY_TAKEN'
                    response_code = status.HTTP_409_CONFLICT
                else:
                    error_response['error']['username'] = 'INVALID'
            if error.get('password'):
                error_response['error']['password'] = error['password'][0]['code']
                if error_response['error']['password'] == 'blank':
                    error_response['error']['password'] = 'PASSWORD_MIN'
            return Response(error_response, status=response_code)

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
            return Response({'error': {'auth': 'AUTH_FAIL'}},
                        status=status.HTTP_401_UNAUTHORIZED)
        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        user = authenticate(email=email, password=password)

        if user is not None:
            try:
                token = RefreshToken.for_user(user)
                response = Response({'username': user.profile.username,
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
                return Response({'error': {'auth': 'AUTH_FAIL'}},
                                status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': {'auth': 'AUTH_FAIL'}},
                        status=status.HTTP_401_UNAUTHORIZED)

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
        else:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                return Response({'error': {'auth': 'AUTH_FAIL'}},
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
                    new_refresh = response.data.pop('refresh')
                    token = RefreshToken(new_refresh)
                    user = SiteUser.objects.get(id=token['user_id'])
                    response.data['username'] = user.profile.username
                    response.set_cookie(
                        key='refresh-token',
                        value=new_refresh,
                        httponly=True, secure=True, samesite='Lax',
                        path='/api/auth/'
                    )
                    return response
                else:
                    return response
            except Exception:
                return Response({'error': {'cookie': 'INVALID'}}, # TODO test
                                status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': {'cookie': 'MISSING_FIELD'}},
                        status=status.HTTP_401_UNAUTHORIZED)

class FriendRequestsSeePend(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all friend requests for user."""
        incomming_req = Friendship.objects.filter(to_user=request.user,
                                                  status='pending')
        outgoing_req = Friendship.objects.filter(from_user=request.user,
                                                 status='pending')
        response_data = {}
        response_data['incomming'] = FriendshipSerializer(incomming_req, many=True).data
        response_data['outgoing'] = FriendshipSerializer(outgoing_req, many=True).data
        return Response(response_data, status=status.HTTP_200_OK)

class FriendSee(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all friend requests for user."""
        friendships = Friendship.objects.filter(
            (Q(to_user=request.user) | Q(from_user=request.user)), 
            status='accepted'
        ).select_related('from_user__profile', 'to_user__profile')
        friends = []
        for f in friendships:
            if f.from_user == request.user:
                friends.append(f.to_user.profile)
            else:
                friends.append(f.from_user.profile)
        serializer = LightProfileSerializer(friends, many=True)
        return Response({'friends': serializer.data}, status=status.HTTP_200_OK)

class FriendRequestsRespond(APIView):
    """Define the functions related to accepting friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Respond to friend request."""
        target = request.data.get('target-username')
        if target is None:
            return (Response({'error': {'target-username': 'MISSING_FIELD'}},
                             status=status.HTTP_400_BAD_REQUEST))
        target_user = SiteUser.objects.filter(profile__username=target)
        if target_user.count() < 1:
            return (Response({'error': {'target-username': 'NOT_FOUND'},
                              'requested': request.data.get('target-username')},
                              status=status.HTTP_400_BAD_REQUEST))
        sender = target_user.first()
        user = request.user
        curr_relationship = Friendship.objects.filter(
            from_user=sender,
            to_user=user
        ).first()
        if curr_relationship and curr_relationship.status == 'pending':
            if request.data['new-status'] == 'accept':
                curr_relationship.status = 'accepted'
                curr_relationship.save()
                return Response({'description': 'REQUEST_ACCEPTED',
                                 'target-username': target}, 
                                status=status.HTTP_200_OK)
            elif request.data['new-status'] == 'reject':
                curr_relationship.delete()
                return Response({'description': 'REQUEST_REJECTED',
                                    'target-username': target}, 
                                status=status.HTTP_200_OK)
        
        return Response({'error': {'friendship': 'NOT_FOUND'}}, 
                        status=status.HTTP_400_BAD_REQUEST)
            
class FriendRequestsSend(APIView):
    """Define the functions related to sending friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Send friend request."""
        target = request.data.get('target-username')
        if target is None:
            return (Response({'error': {'target-username': 'MISSING_FIELD'}},
                                status=status.HTTP_400_BAD_REQUEST))
        target_user = SiteUser.objects.filter(profile__username=target)
        if target_user.count() < 1:
            return (Response({'error': {'target-username': 'NOT_FOUND'},
                                'requested': request.data.get('target-username')},
                                status=status.HTTP_400_BAD_REQUEST))
        recipient = target_user.first()
        user = request.user
        if recipient == user:
            return Response({'error': {'friendship': 'REALLY_SAD'}}, 
                            status=status.HTTP_400_BAD_REQUEST)
        curr_relationship = Friendship.objects.filter(
            from_user=user, 
            to_user=recipient,
        )
        if curr_relationship.exists():
            return Response({'error': {'friendship': 'ALREADY_EXISTS'},
                            'request_status': curr_relationship.first().status},
                            status=status.HTTP_400_BAD_REQUEST)
        Friendship.objects.create(
            from_user=user,
            to_user=recipient,
            status='pending'
        )
        return Response({'description': 'FRIENDSHIP_REQUEST_SENT',
                            'target-username': target}, 
                        status=status.HTTP_201_CREATED)
