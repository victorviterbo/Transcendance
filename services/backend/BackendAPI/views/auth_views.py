"""Defines the views relatives to user registration, login, password change etc."""

from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login

from ..models import SiteUser


class LoginView(APIView):
    """Define the login page."""
    #permission_classes = [AllowAny]
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
                login(request, user)
                return Response({"detail": "User successfully logged in"}, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({"detail": f"Invalid Credentials: {e}"},
                         status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Invalid Credentials"},
                        status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(APIView):
    """Define the register page."""
    #permission_classes = [AllowAny]
    def post(self, request: Request) -> "Response":
        """Handles user registration request.
        
        Args:
            request: the incomming request
        Returns:
            Response to be sent to the front
        """
        email = request.data.get('email')
        password = request.data.get('password')
        try:
            user = SiteUser.manager.create_user(email, password,
                                                username=request.data.get('username'))
            return Response({"detail": "New user successfully created"}, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": f"Could not create user: {e}"},
                        status=status.HTTP_400_BAD_REQUEST)
