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