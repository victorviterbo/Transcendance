"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Room
"""

from rest_framework import serializers

from userprofile.serializers import LightProfileSerializer

from .models import Message, Room


class RoomSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's friendship requests."""
    participants = LightProfileSerializer(read_only=True, many=True)
    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Room
        fields = ['name',
                  'participants',
                  'is_direct',
                  'direct_key',
                  'uid']

class MessageSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's friendship requests."""
    sender_profile = LightProfileSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Message
        fields = ['sender_profile',
                  'room',
                  'body',
                  'delivered',
                  'seen',
                  'updated',
                  'created',
                  'uid']

class FriendChatMessageSerializer(serializers.Serializer):
    """Serialize a direct-message `Message` into the frontend friend-chat contract.
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
            'target-id': str(recipient_profile.uid) if recipient_profile else None,
            'target': recipient_profile.username if recipient_profile else None,
            'uid': str(message.uid),
        }
        if direction == 'outgoing':
            payload['status'] = 'read' if message.seen else ('recieved' if message.delivered else 'sent')
        return payload