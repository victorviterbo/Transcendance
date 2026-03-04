
"""Defines the views relatives to user registration, login, password change etc."""

from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import LightProfileSerializer, ProfileSerializer


class ProfileView(APIView):
    """Define view of the user's own profile."""

    def get_permissions(self) -> list:
        """Specify necessary permissions for different operations."""
        if self.request.method == 'GET':
            return [AllowAny()]
        elif self.request.method == 'POST':
            return [IsAuthenticated()]
        return super().get_permissions()
    
    def get(self, request: Request) -> Response:
        """Handles display of user profile.
        
        Args:
            request:
                Header: [Authorization]

        Returns:
            Response:
                200: {image}
                400: {error{email, username}}
        """
        query = self.request.query_params.get('q')
        if query is None:
            return (Response({'error': 'Query string not found'},
                             status=status.HTTP_400_BAD_REQUEST))
        elif query == '':
            return (Response({'error': 'Invalid empty query string'},
                             status=status.HTTP_400_BAD_REQUEST))
        queried_profiles = Profile.objects.filter(username=query)
        if not queried_profiles.exists():
            return Response({'error': 'No profile with this username'}, status=status.HTTP_400_BAD_REQUEST)
        queried_profile = queried_profiles.first()
        try:
            profile_serializer = ProfileSerializer(queried_profile, many=False)
            ret_data = profile_serializer.data.copy()
            if queried_profile.user:
                ret_data['email'] = queried_profile.user.email
            return Response(ret_data, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return Response({"description": f"Could not return Profile: {e}"},
                            status=status.HTTP_500_INTERNAL_ERROR)
    
    def post(self, request: Request) -> Response:
        """Handles update of user profile.
        
        Args:
            request:
                Header: [Authorization]
                payload: json with updated values of profile informations

        Returns:
            Response:
                200: {"description": "Updated Profile successfully"
                400: {"error": "Could not update Profile"}
                401: {"error": "Unauthorized: <error>"}
        """
        profile = request.user.profile
        try:
            profile_serializer = ProfileSerializer(profile,
                                                   data=request.data,
                                                   many=False)
            if profile_serializer.is_valid(raise_exception=True):
                profile_serializer.save()
                profile.user.username = profile.username
                return Response({"description": "Updated Profile successfully"},
                                status=status.HTTP_200_OK)
            else:
                return Response({"error": "Could not update Profile"},
                                status=status.HTTP_400_BAD_REQUEST)
        except serializers.ValidationError as e:
            return Response({"errror": f"Unauthorized: {e}"},
                            status=status.HTTP_401_UNAUTHORIZED)

class   UserSearchView(APIView):
    """Search for a specific user (necessarily registered) and return their profiles."""
    permission_classes = [IsAuthenticated]
    def get(self, request: Request) -> Response:
        """Returns all users matching the query."""
        query = self.request.query_params.get('q')
        if query is None:
            return (Response({'error': 'no search query sent'},
                             status=status.HTTP_400_BAD_REQUEST))
        profiles = Profile.objects.filter(user__username__icontains=query)\
            .exclude(user=self.request.user).exclude(user=None)
        serializer = LightProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class   ProfileSearchView(APIView):
    """Search for a specific profile.

    Search for the queried string in the database for profiles based on username
    and return their profiles.
    The Profile may not have an associated authenticated user
    """

    def get(self, request: Request) -> Response:
        """Returns all profiles matching the query."""
        query = self.request.query_params.get('q')
        if query is None:
            return (Response({'error': 'no search query sent'},
                             status=status.HTTP_400_BAD_REQUEST))
        profiles = Profile.objects.filter(username=query)\
            .exclude(user=self.request.user)
        serializer = LightProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
  