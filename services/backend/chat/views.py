"""HTTP views for chat room lookups, direct-message room creation, and fallback posting."""

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import redirect
from friends.models import Friendship
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from userprofile.models import Profile

from .models import Message, Room

User = get_user_model()


def _direct_key_for(user_a: Profile, user_b: Profile) -> str:
    """Generate a stable, unique key for a direct message room between two users.

    Ensures Alice↔Bob has the same key regardless of call order.

    Args:
        user_a, user_b: User objects
    
    Returns:
        String key 'user_<min_id>_user_<max_id>'
    """
    id_a, id_b = user_a.id, user_b.id
    min_id, max_id = (id_a, id_b) if id_a < id_b else (id_b, id_a)
    return f'user_{min_id}_user_{max_id}'

class DirectMessageView(APIView):
    """Create or join the new chatroom that comes with every new game."""
    permission_classes=[IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Create or fetch a direct-message room shared by the current user and target user."""
        if request.profile.is_guest:
            return Response({'error': {'auth': 'INVALID_CREDENTIALS'}},
                            status=status.HTTP_401_UNAUTHORIZED)
        if not request.data.get('target-username'):
            return Response({'error': {'target-username': 'MISSING_FIELD'}},
                                status=status.HTTP_400_BAD_REQUEST)
        target_profile = Profile.objects.filter(username=request.data.get('target-username')).first()
        if not target_profile:
            return Response({'error': {'target-username': 'USER_NOT_FOUND'}},
                                status=status.HTTP_400_BAD_REQUEST)
        if request.profile.id == target_profile.id:
            return Response({'error': {'target-username': 'CANNOT_SELF_DM'}},
                                status=status.HTTP_400_BAD_REQUEST)
        are_friends = Friendship.objects.filter(Q(status='accepted') &
                ((Q(from_user=request.profile.user) & Q(to_user=target_profile.user)) |
                (Q(from_user=target_profile.user) & Q(to_user=request.profile.user)))
            ).exists()
        if not are_friends:
            return Response({'error': {'target-username': 'USER_NOT_FRIEND'}},
                                status=status.HTTP_403_FORBIDDEN)

        direct_key = _direct_key_for(request.profile, target_profile)

        room, created = Room.objects.get_or_create(
            direct_key=direct_key,
            defaults={
                'name': direct_key,
                'is_direct': True,
            }
        )
        if created:
            room.participants.add(request.profile, target_profile)
        return Response({
            'room_id': room.id,
            'room_name': room.name,
            'is_new': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class RoomView(APIView):
    """HTTP view to see room status or create one."""
    permission_classes=[AllowAny]

    def get(self, request: Request, pk: int) -> Response:
        """Return room metadata."""
        try:
            room = Room.objects.get(id=pk)
            if room:
                return Response({
                    'room_id': room.id,
                    'room_name': room.name,
                    'is_new': False
                },
                status=status.HTTP_200_OK)
        except Room.DoesNotExist:
            return Response({'error': {'room': 'ROOM_NOT_FOUND'}},
                            status=status.HTTP_404_NOT_FOUND)

    def post(self, request: Request, pk: int) -> Response:
        """Create a message through the HTTP fallback form flow.
        
        HTTP POST fallback (INPUT): the page form submits here when JS/WebSocket
        isn't used. This creates the Message in the database and (OUTPUT) redirects
        back to the room.
        """
        try:
            room = Room.objects.get(id=pk)
        except Room.DoesNotExist:
            return Response({'error': {'room': 'ROOM_NOT_FOUND'}},
                            status=status.HTTP_404_NOT_FOUND)
        if not room.participants.filter(id=request.profile.id).exists():
            room.participants.add(request.profile)
        Message.objects.create(
            sender_profile=request.profile,
            room=room,
            body=request.POST.get('body')
        )
        return Response({
            'room_id': room.id,
            'room_name': room.name,
            'is_new': False
        }, status=status.HTTP_200_OK)
