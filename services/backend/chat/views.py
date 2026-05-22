"""HTTP views for chat room lookups, direct-message room creation, and fallback posting."""

import uuid

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .chat_utils import accepted_friendship, create_direct_room, resolve_recipient_user
from .models import Message, Room
from .serializers import MessageSerializer, RoomSerializer, FriendChatMessageSerializer

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
    
class DirectMessageView(APIView):
    """Create a direct message view that friend to friend can private chat with each other."""
    permission_classes=[IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Create or fetch a direct-message room shared by the current user and target user."""
        current_profile = request.profile
        if current_profile.guest:
            return Response({'error': {'auth': 'INVALID_CREDENTIALS'}},
                            status=status.HTTP_401_UNAUTHORIZED)
        if not request.data.get('user_uid'):
            return Response({'error': {'user_uid': 'MISSING_FIELD'}},
                                status=status.HTTP_400_BAD_REQUEST)
        recipient_user = resolve_recipient_user(request.data['user_uid'])
        if recipient_user is None:
            return Response({'error': {'user_uid': 'USER_NOT_FOUND'}},
                                status=status.HTTP_400_BAD_REQUEST)
        recipient_profile = recipient_user.profile
        if current_profile.uid == recipient_profile.uid:
            return Response({'error': {'user_uid': 'CANNOT_SELF_DM'}},
                                status=status.HTTP_400_BAD_REQUEST)
        if not accepted_friendship(current_profile, recipient_profile):
            return Response({'error': {'user_uid': 'USER_NOT_FRIEND'}},
                                status=status.HTTP_403_FORBIDDEN)

        room, created = create_direct_room(current_profile, recipient_profile)
        if created:
            room.participants.add(current_profile, recipient_profile)
        return Response({
            'room_uid': room.uid,
            'room_name': room.name,
            'is_new': created,
            'is_direct': True,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK) 

class FriendMessageFeed(APIView):
    """Return direct-message history between the authenticated user and a friend."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Fetch a friend chat feed in the frontend contract shape."""
        current_profile = request.profile
        recipient_uid = request.data.get('uid') or request.data.get('user_uid') or request.data.get('target-uid')
        if recipient_uid is None:
            return Response(
                {'error': {'target-uid': 'MISSING_FIELD'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        recipient_user = resolve_recipient_user(recipient_uid)
        if recipient_user is None:
            return Response(
                {'error': {'target-uid': 'USER_NOT_FOUND'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if recipient_user == request.user:
            return Response({'error': {'uid': 'CANNOT_SELF_DM'}}, status=status.HTTP_400_BAD_REQUEST)

        if not accepted_friendship(current_profile, recipient_user.profile):
            return Response({'error': {'uid': 'USER_NOT_FRIEND'}}, status=status.HTTP_403_FORBIDDEN)

        room, created = create_direct_room(current_profile, recipient_user.profile)
        if created:
            room.participants.add(current_profile, recipient_user.profile)

        channel_layer = get_channel_layer()
        feed: list[dict[str, object]] = []
        messages = Message.objects.filter(room=room).select_related('sender_profile').order_by('created')
        for m in messages:
            is_outgoing = m.sender_profile_id == current_profile.id
            if not is_outgoing and not m.seen:
                update_fields: list[str] = []
                if not m.delivered:
                    m.delivered = True
                    update_fields.append('delivered')
                m.seen = True
                update_fields.append('seen')
                m.save(update_fields=update_fields)

                if channel_layer:
                    payload: dict[str, object] = {
                        'target': 'friend-chat',
                        'event': 'update_status',
                        'message': FriendChatMessageSerializer(
                            m,
                            context={'recipient_profile': current_profile, 'direction': 'outgoing'},
                        ).data,
                    }
                    async_to_sync(channel_layer.group_send)(
                        f'user_{m.sender_profile.uid}',
                        {
                            'type': 'send.notification',
                            'payload': payload,
                        },
                    )
            payload: dict[str, object] = FriendChatMessageSerializer(
                m,
                context={'recipient_profile': recipient_user.profile, 'direction': 'outgoing' if is_outgoing else 'incoming'},
            ).data
            feed.append(payload)
        return Response({'feed': feed}, status=status.HTTP_200_OK)
        