"""Defines the views relatives to user registration, login, password change etc."""

from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import LightProfileSerializer, ProfileSerializer


def parse_validation_errors(val_error: serializers.ValidationError) -> Response:
    """Format the validation error structure to match the expected format."""
    error = val_error.get_full_details()
    error_response = {'error': {}}
    response_code = status.HTTP_400_BAD_REQUEST
    for field, details in error.items():
        if field == 'username' and details[0]['code'] == 'unique' or details[0]['code'] == 'USERNAME_TAKEN':
                response_code = status.HTTP_409_CONFLICT
                error_response['error'][field] = 'USERNAME_TAKEN'
        else:
            error_response['error'][field] = details[0]['code'].upper()
    return Response(error_response, status=response_code)

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
            return (Response({'error': {'query': 'MISSING_FIELD'}},
                             status=status.HTTP_400_BAD_REQUEST))
        queried_profiles = Profile.objects.filter(username=query)
        if not queried_profiles.exists():
            return Response({'error': {'query': 'USER_NOT_FOUND'}},
                            status=status.HTTP_400_BAD_REQUEST)
        queried_profile = queried_profiles.first()
        try:
            profile_serializer = ProfileSerializer(queried_profile, many=False)
            ret_data = profile_serializer.data.copy()
            if queried_profile.user:
                ret_data['email'] = queried_profile.user.email
            return Response(ret_data, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return parse_validation_errors(e)
            
    
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
            return (Response({'error': {'query': 'MISSING_FIELD'}},
                             status=status.HTTP_400_BAD_REQUEST))
        elif query == '':
            return (Response({'error': {'query': 'EMPTY_FIELD'}},
                             status=status.HTTP_400_BAD_REQUEST))
        profiles = Profile.objects.filter(username=query)
        serializer = LightProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GuestProfileCreateView(APIView):
    """Create a profile without related user (guest)."""
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Check if user is known, if yes update, if not create."""
        if not request.session.session_key:
            request.session.create()
            profile = None
        else:
            profile = Profile.objects.filter(
                session_key=request.session.session_key, 
                is_guest=True
            ).first()
        
        if profile:
            serializer = LightProfileSerializer(
                instance=profile, 
                data=request.data, 
                partial=True,
                context={'is_creation': False}
            )
        else:
            serializer = LightProfileSerializer(
                data=request.data, 
                context={'is_creation': True}
            )

        if serializer.is_valid():
            serializer.save(
                session_key=request.session.session_key,
                is_guest=True
            )
            if profile:
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GuestCleanupView(APIView):
    """End point for guest cleanup."""

    def post(self, request: Request) -> Response:
        """Receive front beacon to activate guest leaving."""
        session_key = request.session.session_key
        if session_key:
            profile = Profile.objects.filter(session_key=session_key,
                                             is_guest=True).first()
            if profile:
                profile.delete() 
        return Response(status=status.HTTP_204_NO_CONTENT)
