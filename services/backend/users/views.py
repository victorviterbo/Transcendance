"""Defines the views relatives to user modification change etc."""

from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from userauth.models import SiteUser
from .serializers import UsersSerializer
from userprofile.models import Profile
from userprofile.serializers import ProfileSerializer
from userprofile.views import parse_validation_errors


class SelfProfile(APIView):
    """Get, update and delete user's own profile."""
    permission_classes=[IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Handles display of user profile."""
        try:
            profile_serializer = UsersSerializer(self.request.profile)
            ret_data = profile_serializer.data.copy()
            return Response(ret_data, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return parse_validation_errors(e)

    def post(self, request: Request) -> Response:
        """Handles update of user profile."""
        try:
            serializer = UsersSerializer(instance=request.profile,
                                                   data=request.data,
                                                   partial=True,
                                                   many=False)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(serializer.data,
                                status=status.HTTP_200_OK)
            else:
                return Response({'error': {'profile': 'UPDATE_FAIL'}},
                                status=status.HTTP_400_BAD_REQUEST)
        except serializers.ValidationError as e:
            return parse_validation_errors(e)
    
    def delete(self, request: Request) -> Response:
        """Handles update of user profile."""
        try:
            profile_serializer = ProfileSerializer(instance=request.profile,
                                                   data=request.data,
                                                   partial=True,
                                                   many=False)
            if profile_serializer.is_valid(raise_exception=True):
                profile_serializer.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({'error': {'profile': 'USER_DELETE_FAIL'}},
                                status=status.HTTP_400_BAD_REQUEST)
        except serializers.ValidationError as e:
            return parse_validation_errors(e)
















class OthersProfile(APIView):
    """Get, update and delete user's own profile."""
    permission_classes=[IsAuthenticated]

    def get(self, request: Request, username: str) -> Response:
        """Handles display of user profile."""
        try:
            profile = Profile.objects.filter(username=username).first()
            profile_serializer = ProfileSerializer(profile)
            ret_data = profile_serializer.data.copy()
            if self.request.user:
                ret_data['email'] = self.user.email
            return Response(ret_data, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return parse_validation_errors(e)

    def post(self, request: Request) -> Response:
        """Handles update of user profile."""
        try:
            profile_serializer = ProfileSerializer(instance=request.profile,
                                                   data=request.data,
                                                   partial=True,
                                                   many=False)
            if profile_serializer.is_valid(raise_exception=True):
                profile_serializer.save()
                return Response(profile_serializer.data,
                                status=status.HTTP_200_OK)
            else:
                return Response({'error': {'profile': 'UPDATE_FAIL'}},
                                status=status.HTTP_400_BAD_REQUEST)
        except serializers.ValidationError as e:
            return parse_validation_errors(e)
