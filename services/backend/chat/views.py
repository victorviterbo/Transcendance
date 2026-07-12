"""HTTP views for direct-message room creation and friend-message feeds."""

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .chat_utils import accepted_friendship, resolve_recipient_user, direct_key
from .models import Message, Room
from .serializers import FriendChatMessageSerializer

logger = logging.getLogger(__name__)
    
class FriendMessageFeed(APIView):
    """Return direct-message history between the authenticated user and a friend."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Fetch a friend chat feed in the frontend contract shape."""
        current_profile = request.profile
        recipient_uid = request.data.get('uid') or request.data.get('user_uid') or request.data.get('targetUid')
        if recipient_uid is None:
            return Response(
                {'error': {'targetUid': 'MISSING_FIELD'}},
                status=status.HTTP_400_BAD_REQUEST,)
        recipient_user = resolve_recipient_user(recipient_uid)
        if recipient_user is None:
            return Response(
                {'error': {'targetUid': 'USER_NOT_FOUND'}},
                status=status.HTTP_400_BAD_REQUEST,)
        if recipient_user == request.user:
            return Response({'error': {'uid': 'CANNOT_SELF_DM'}}, status=status.HTTP_400_BAD_REQUEST)
        if not accepted_friendship(current_profile, recipient_user.profile):
            return Response({'error': {'uid': 'USER_NOT_FRIEND'}}, status=status.HTTP_403_FORBIDDEN)

        room = Room.objects.filter(
            direct_key=direct_key(current_profile, recipient_user.profile)
        ).first()
        if room is None:
            return Response({'feed': []}, status=status.HTTP_200_OK)
        
        channel_layer = get_channel_layer()
        feed = []
        messages = Message.objects.filter(room=room).select_related('sender').order_by('created')
        for m in messages:
            is_outgoing = m.sender_id == current_profile.id
            if not is_outgoing and not m.seen:
                update_fields = []
                if not m.delivered:
                    m.delivered = True
                    update_fields.append('delivered')
                m.seen = True
                update_fields.append('seen')
                m.save(update_fields=update_fields)
                logger.info('feed.marked_seen message_uid=%s', m.uid)
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f'user_{m.sender.uid}',
                        {
                            'type': 'send.notification',
                            'payload': {
                                'target': 'friend_chat',
                                'event': 'update_status',
                                'message': FriendChatMessageSerializer(
                                    m,
                                    context={'recipient_profile': current_profile, 'direction': 'outgoing'},
                                ).data,}
                        },)
                    logger.info('feed.notified_sender sender_uid=%s message_uid=%s', m.sender.uid, m.uid)
            
            feed.append(FriendChatMessageSerializer(
                m,
                context={'recipient_profile': recipient_user.profile, 'direction': 'outgoing' if is_outgoing else 'incoming'},
            ).data)
        return Response({'feed': feed}, status=status.HTTP_200_OK)
        
