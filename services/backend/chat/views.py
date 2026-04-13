"""HTTP views for chat room lookups, direct-message room creation, and fallback posting."""

import uuid

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from userprofile.models import Profile

from .chat_utils import accepted_friendship_exists, get_or_create_direct_room
from .models import Room
from .serializers import MessageSerializer, RoomSerializer

User = get_user_model()

class DirectMessageView(APIView):
    """Create or join the new chatroom that comes with every new game."""
    permission_classes=[IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Create or fetch a direct-message room shared by the current user and target user."""
        if request.profile.is_guest:
            return Response({'error': {'auth': 'INVALID_CREDENTIALS'}},
                            status=status.HTTP_401_UNAUTHORIZED)
        if not request.data.get('user_uid'):
            return Response({'error': {'user_uid': 'MISSING_FIELD'}},
                                status=status.HTTP_400_BAD_REQUEST)
        target_profile = Profile.objects.filter(user__uid=self.request.data['user_uid']).first()
        if not target_profile:
            return Response({'error': {'user_uid': 'USER_NOT_FOUND'}},
                                status=status.HTTP_400_BAD_REQUEST)
        if request.profile.uid == target_profile.uid:
            return Response({'error': {'user_uid': 'CANNOT_SELF_DM'}},
                                status=status.HTTP_400_BAD_REQUEST)
        if not accepted_friendship_exists(request.profile, target_profile):
            return Response({'error': {'user_uid': 'USER_NOT_FRIEND'}},
                                status=status.HTTP_403_FORBIDDEN)

        room, created = get_or_create_direct_room(request.profile, target_profile)
        if created:
            room.participants.add(request.profile, target_profile)
        return Response({
            'room_uid': room.uid,
            'room_name': room.name,
            'is_new': created,
            'is_direct': True,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class RoomView(APIView):
    """HTTP view to see room status or create one."""
    permission_classes=[AllowAny]

    def get(self, request: Request, room_uid: uuid.UUID) -> Response:
        """Return room metadata."""
        try:
            room = Room.objects.get(uid=room_uid)
            if room:
                serializer = RoomSerializer(room)
                return Response(serializer.data,
                    status=status.HTTP_200_OK)
        except Room.DoesNotExist:
            return Response({'error': {'room': 'ROOM_NOT_FOUND'}},
                            status=status.HTTP_404_NOT_FOUND)

    def post(self, request: Request, room_uid: uuid.UUID) -> Response:
        """Create a message through the HTTP fallback form flow.
        
        HTTP POST fallback (INPUT): the page form submits here when JS/WebSocket
        isn't used. This creates the Message in the database and (OUTPUT) redirects
        back to the room.
        """
        try:
            room = Room.objects.get(uid=room_uid)
        except Room.DoesNotExist:
            return Response({'error': {'room': 'ROOM_NOT_FOUND'}},
                            status=status.HTTP_404_NOT_FOUND)
        if not room.participants.filter(uid=request.profile.uid).exists():
            room.participants.add(request.profile)
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sender_profile=request.profile, room=room)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        