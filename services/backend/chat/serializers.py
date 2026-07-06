"""Implements the serialization the backend. it converts different python objects to JSON """

from rest_framework import serializers

from userprofile.serializers import LightProfileSerializer
from .models import Message


class RoomHistorySerializer(serializers.ModelSerializer):
    """Serialize persisted game room messages for history replay."""
    sender = LightProfileSerializer(read_only=True)
    class Meta:
        """Define the message fields exposed to history consumers from game players."""

        model = Message
        fields = [
            'uid',
            'sender',
            'body',
        ]

class FriendChatMessageSerializer(serializers.Serializer):
    """Serialize a direct-message `Message` into the frontend friend_chat contract.

    This serializer provide:
        - `recipient_profile`: the `Profile` that should appear as the chat partner in the
          payload, and
        - `direction`: one of `'incoming'` or `'outgoing'`.
    """
    def to_representation(self, message: Message) -> dict[str, object]:
        recipient_profile = self.context.get('recipient_profile')
        direction = self.context.get('direction', 'incoming')
        payload: dict[str, object] = {
            'message': message.body,
            'date': message.created.isoformat(),
            'direction': direction,
            'targetUid': str(recipient_profile.uid) if recipient_profile else None,
            'target': recipient_profile.username if recipient_profile else None,
            'uid': str(message.uid),
        }
        if direction == 'outgoing':
            payload['status'] = 'read' if message.seen else ('recieved' if message.delivered else 'sent')
        return payload
