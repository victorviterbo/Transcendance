"""Defines the views relatives to user registration, login, password change etc."""

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import SiteUser
from .serializers import SiteUserSerializer, ProfileSerializer

class LoginView(APIView):
    """Define the login page."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> "Response":
        """Handles login request.
        
        Args:
            request:
                payload: {email, password}
        Returns:
            Response:
                200 : {access}
                    Set-Cookie: refresh token to get a new access token when the current expires
                401 : {error}
        """
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            try:
                token = RefreshToken.for_user(user)
                response = Response({'username': user.username, 'access': str(token.access_token)},
                                     status=status.HTTP_200_OK)
                response.set_cookie(
                    key='refresh-token',
                    value=str(token),
                    httponly=True, secure=True, samesite='Lax',
                    path='/api/auth/'
                )
                return response
            except ValueError as e:
                return Response({'error': f"Wrong email or password: {e}"},
                         status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': 'Wrong email or password'},
                        status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(APIView):
    """Define the register page."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> "Response":
        """Handles user registration request.
        
        Args:
            request:
                payload: {username, email, password}
        Returns:
            Response:
                201 : {description}
                400 : {error{email, username}}
        """
        try:
            serializer = SiteUserSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response({'description': 'User created'}, status=status.HTTP_201_CREATED)
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
            if error.get('username'):
                if any(['unique' in e['code'] for e in error['username']]):
                    error_response['error']['username'] = 'Username already taken'
                    response_code = status.HTTP_409_CONFLICT
                else:
                    error_response['error']['username'] = 'Invalid Username'
            return Response(error_response, status=response_code)

class ProfileView(APIView):
    """Define view of the user's own profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request):
        """Handles display of user profile.
        
        Args:
            request:
                Header: [Authorization]
        Returns:
            Response:
                200 : {image}
                400 : {error{email, username}}
        """
        profile = request.user.profile
        try:
            profile_serializer = ProfileSerializer(profile, many=False)
            return Response(profile_serializer.data, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return Response({"detail": f"Could not return Profile : {e}"}, status=status.HTTP_500_INTERNAL_ERROR)
    
    def post(self, request: Request):
        profile = request.user.profile
        try:
            profile_serializer = ProfileSerializer(profile, data=request.data, many=False)
            if profile_serializer.is_valid(raise_exception=True):
                profile_serializer.save()
                return Response({"detail": "Updated Profile successfully"}, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Could not update Profile"}, status=status.HTTP_400_BAD_REQUEST)
        except serializers.ValidationError as e:
            return Response({"detail": f"Could not update Profile : {e}"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh-token')
        
        if not refresh_token:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        response = Response({'detail': 'Logged out successfully'}, status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(
            'refresh-token',
            samesite='Lax',
            path='/api/auth/'
        )
        return response
    
    
class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh-token')
        
        if refresh_token:
            request.data['refresh'] = refresh_token
            serializer = self.get_serializer(data=request.data)
            try:
                if serializer.is_valid():
                    token = RefreshToken(refresh_token)
                    user = SiteUser.objects.get(id=token['user_id'])
                    response =  super().post(request, *args, **kwargs)
                    response.data['username'] = user.username
                    return response
                else:
                    return Response({"detail": f"Refresh token invalid: {serializer.error}"}, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as e:
                return Response({"detail": f"Refresh token invalid: {e}"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({"detail": "Refresh token not found in cookies"}, status=status.HTTP_401_UNAUTHORIZED)