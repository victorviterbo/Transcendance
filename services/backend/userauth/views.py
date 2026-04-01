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
                    Profile.objects.filter(id=guest_id, is_guest=True).delete()
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
            except Exception as e:
                return Response({'error': {'cookie': e.detail['code'].upper()}}, # TODO test
                                status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': {'cookie': 'MISSING_FIELD'}},
                        status=status.HTTP_401_UNAUTHORIZED)



class UpdatePasswordView(APIView):
    """Define updating of password."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Define updating of password."""
        if (request.data.get('old_password') is None and
            request.data.get('new_password') is None):
            return Response({'error': {'old_password': 'MISSING_FIELD',
                                       'new_password': 'MISSING_FIELD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('old_password') is None:
            return Response({'error': {'old_password': 'MISSING_FIELD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('new_password') is None:
            return Response({'error': {'new_password': 'MISSING_FIELD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        if not self.request.user.check_password(request.data['old_password']):
            return Response({'error': {'old_password': 'INVALID_PASSWORD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(request.data['new_password'], user=self.request.user)
            self.request.user.set_password(request.data['new_password'])
            self.request.user.save()
            return Response('PASSWORD_UPDATED', status=status.HTTP_200_OK)
        except coreValidationError:
            return Response({'error': {'password': 'INVALID_PASSWORD'}},
                            status=status.HTTP_400_BAD_REQUEST)
        