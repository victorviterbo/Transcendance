"""HTTP views for chat room lookups, direct-message room creation, and fallback posting."""

import uuid

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from userauth.models import SiteUser
from userprofile.models import Profile

from .chat_utils import accepted_friendship_exists, get_or_create_direct_room
from .models import Message, Room
from .serializers import MessageSerializer, RoomSerializer


def _resolve_target_user(target_uid: str | None) -> SiteUser | None:
    """Resolve a target user from either SiteUser.uid or Profile.uid."""

    if target_uid is None:
        return None

    user = SiteUser.objects.filter(uid=target_uid).select_related('profile').first()
    if user:
        return user

    profile = Profile.objects.filter(uid=target_uid).select_related('user').first()
    if not profile:
        return None
    return profile.user

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


class FriendMessageFeed(APIView):
    """Return direct-message history between the authenticated user and a friend."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Fetch a friend chat feed in the frontend contract shape."""

        target_uid = request.data.get('uid') or request.data.get('user_uid') or request.data.get('target-uid')
        if target_uid is None:
            return Response(
                {'error': {'uid': 'MISSING_FIELD', 'user_uid': 'MISSING_FIELD', 'target-uid': 'MISSING_FIELD'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user = _resolve_target_user(target_uid)
        if target_user is None:
            return Response(
                {'error': {'uid': 'USER_NOT_FOUND', 'user_uid': 'USER_NOT_FOUND', 'target-uid': 'USER_NOT_FOUND'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_user == request.user:
            return Response({'error': {'uid': 'CANNOT_SELF_DM'}}, status=status.HTTP_400_BAD_REQUEST)

        if not accepted_friendship_exists(request.user.profile, target_user.profile):
            return Response({'error': {'uid': 'USER_NOT_FRIEND'}}, status=status.HTTP_403_FORBIDDEN)

        room, created = get_or_create_direct_room(request.user.profile, target_user.profile)
        if created:
            room.participants.add(request.user.profile, target_user.profile)

        feed: list[dict[str, object]] = []
        messages = Message.objects.filter(room=room).select_related('sender_profile').order_by('created')
        for message in messages:
            is_outgoing = message.sender_profile_id == request.user.profile.id
            payload: dict[str, object] = {
                'message': message.body,
                'date': message.created.isoformat(),
                'direction': 'outgoing' if is_outgoing else 'incoming',
                'target-id': str(target_user.profile.uid),
                'target': target_user.profile.username,
                'uid': str(message.uid),
            }
            if is_outgoing:
                if message.seen:
                    payload['status'] = 'read'
                elif message.delivered:
                    payload['status'] = 'recieved'
                else:
                    payload['status'] = 'sent'
            feed.append(payload)

        return Response({'feed': feed}, status=status.HTTP_200_OK)
        