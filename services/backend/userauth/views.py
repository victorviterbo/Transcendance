"""Defines the views relatives to user registration, login, password change etc."""

from typing import Any

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as coreValidationError
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from userprofile.models import Profile

from .models import SiteUser
from .serializers import LoginSerializer, RegisterSerializer


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
            serializer = serializer = RegisterSerializer(data=renamed_data,
                                                         context={
                                                             'request': request,
                                                             'is_creation': True}
            )
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
                request.session.pop('guest_profile_id', None)
                request.session.modified = True
                return response
        
        except serializers.ValidationError as e:
            error = e.get_full_details()
            error_response = {'error':{}}
            response_code = status.HTTP_400_BAD_REQUEST
            if error.get('email'):
                if any(['unique' in e['code'].lower() for e in error['email']]):
                    error_response['error']['email'] = 'EMAIL_TAKEN'
                    response_code = status.HTTP_409_CONFLICT
                else:
                    error_response['error']['email'] = 'INVALID_EMAIL'
            if error.get('profile_username'):
                if any([e['code'] in ['unique', 'USERNAME_TAKEN']
                        for e in error['profile_username']]):
                    error_response['error']['username'] = 'USERNAME_TAKEN'
                    response_code = status.HTTP_409_CONFLICT
                else:
                    error_response['error']['username'] = 'INVALID_USERNAME'
            if error.get('password'):
                error_response['error']['password'] = 'INVALID_PASSWORD'
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
            return Response({'error': {'auth': 'INVALID_CREDENTIALS'}},
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
                guest_id = request.session.get('guest_profile_id')
                if guest_id:
                    profile = Profile.objects.filter(id=guest_id, is_guest=True)
                    if profile.exists():
                        profile.delete()
                        request.profile = user.profile
                        request.session.pop('guest_profile_id', None)
                return response
            except ValueError:
                return Response({'error': {'auth': 'INVALID_CREDENTIALS'}},
                                status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': {'auth': 'INVALID_CREDENTIALS'}},
                        status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    """Define lougout operation view."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Handles display of user profile."""
        refresh_token = request.COOKIES.get('refresh-token')
        
        if not refresh_token:
            response = Response(status=status.HTTP_204_NO_CONTENT)
        else:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                return Response({'error': {'auth': 'INVALID_CREDENTIALS'}},
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
        """Handles display of user profile."""
        refresh_token = request.COOKIES.get('refresh-token')
        if not refresh_token:
            return Response({'error': {'cookie': 'MISSING_FIELD'}},
                            status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError):
            return Response({'error': {'cookie': 'TOKEN_NOT_VALID'}},
                            status=status.HTTP_401_UNAUTHORIZED)
        except Exception:
            return Response({'error': {'cookie': 'INVALID'}},
                            status=status.HTTP_401_UNAUTHORIZED)

        response_data = serializer.validated_data.copy()
        new_refresh = response_data.pop('refresh', None)

        try:
            token = RefreshToken(new_refresh or refresh_token)
            user = SiteUser.objects.get(id=token['user_id'])
            response_data['username'] = user.profile.username
        except (KeyError, SiteUser.DoesNotExist, TokenError):
            return Response({'error': {'cookie': 'TOKEN_NOT_VALID'}},
                            status=status.HTTP_401_UNAUTHORIZED)

        response = Response(response_data, status=status.HTTP_200_OK)
        if new_refresh:
            response.set_cookie(
                key='refresh-token',
                value=new_refresh,
                httponly=True, secure=True, samesite='Lax',
                path='/api/auth/'
            )
        return response

class UpdatePasswordView(APIView):
    """Define updating of password."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Define updating of password."""
        if (request.data.get('currentPassword') is None and
            request.data.get('newPassword') is None):
            return Response({'error': {'currentPassword': 'MISSING_FIELD',
                                       'newPassword': 'MISSING_FIELD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('currentPassword') is None:
            return Response({'error': {'currentPassword': 'MISSING_FIELD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('newPassword') is None:
            return Response({'error': {'newPassword': 'MISSING_FIELD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        if not self.request.user.check_password(request.data['currentPassword']):
            return Response({'error': {'currentPassword': 'INVALID_PASSWORD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(request.data['newPassword'], user=self.request.user)
            self.request.user.set_password(request.data['newPassword'])
            self.request.user.save()
            token = RefreshToken.for_user(self.request.user)
            response = Response({
                'description': 'PASSWORD_UPDATED',
                'access': str(token.access_token),
                'username': self.request.user.profile.username,
            }, status=status.HTTP_200_OK)
            response.set_cookie(
                key='refresh-token',
                value=str(token),
                httponly=True, secure=True, samesite='Lax',
                path='/api/auth/'
            )
            return response
        except coreValidationError:
            return Response({'error': {'password': 'INVALID_PASSWORD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        
class DeleteAccountView(APIView):
    """Define deletion of account."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Handles deletion of user profile."""
        user = self.request.user
        if request.data.get('password') is None:
            return Response({'error': {'password': 'MISSING_FIELD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        if not self.request.user.check_password(request.data['password']):
            return Response({'error': {'password': 'INVALID_PASSWORD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        if user:
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'error': {'profile': 'USER_DELETE_FAIL'}},
                            status=status.HTTP_400_BAD_REQUEST)
