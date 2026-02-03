"""Defines the views relatives to user registration, login, password change etc."""

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from django.contrib.auth import authenticate
from rest_framework import serializers
from .serializers import SiteUserSerializer, ProfileSerializer

class LoginView(APIView):
    """Define the login page."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> "Response":
        """Handles login request.
        
        Args:
            request: the incomming request
        Returns:
            Response to be sent to the front
        """
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            try:
                user_serializer = SiteUserSerializer(user, many=False)
                response = Response(user_serializer.data, status=status.HTTP_200_OK)
                token = RefreshToken.for_user(user)
                response.set_cookie(
                    key='access-token',
                    value=str(token.access_token),
                    httponly=True, secure=True, samesite='Lax',
                )
                response.set_cookie(
                    key='refresh-token',
                    value=str(token),
                    httponly=True, secure=True, samesite='Lax',
                    path='/api/token/refresh/'
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
            request: the incomming request
        Returns:
            Response to be sent to the front
        """
        try:
            serializer = SiteUserSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response({'description': 'User created'}, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            error = e.get_full_details()
            error_response = {}
            code_response = None
            if error.get('email') and any(['unique' in e['code'] for e in error['email']]):
                error_response = {'error':{'email':'Email already taken'}}
                code_response = status.HTTP_409_CONFLICT
            if error.get('username') and any(['unique' in e['code'] for e in error['username']]):
                if code_response:
                    error_response['error']['username'] = 'Username already taken'
                else:
                    error_response = {'error':{'username':'Username already taken'}}
            if code_response:
                return Response(error_response, status=status.HTTP_409_CONFLICT)
            if not code_response and error.get('email'):
                return Response({'error':{'email':'Invalid Email'}}, status=status.HTTP_400_BAD_REQUEST)
            elif not code_response:
                return Response({'error':{'username':'Invalid Username'}}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error':e}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    """Define view of the user's own profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request):
        profile = request.user.profile
        try:
            profile_serializer = ProfileSerializer(profile, many=False)
            return Response(profile_serializer.data, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return Response({"detail": f"Could not return Profile : {e}"}, status=status.HTTP_400_BAD_REQUEST)
    
    def post(self, request: Request):
        profile = request.user.profile
        try:
            profile_serializer = ProfileSerializer(profile, data=request.data, many=False)
            profile_serializer.save()
            return Response({"detail": "Updated Profile successfully"}, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return Response({"detail": f"Could not update Profile : {e}"}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({"detail": "Successfully logged out."})
        response.delete_cookie('access-token')
        return response
    
class RefreshTokenView(TokenRefreshView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if refresh_token:
            request.data['refresh'] = refresh_token
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            response.set_cookie(
                key='access-token',
                value=response.data['access'],
                httponly=True, secure=True, samesite='Lax'
            )
            del response.data['access']

        return response