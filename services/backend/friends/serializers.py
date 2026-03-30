"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Friendship
"""
from rest_framework import serializers
from users.serializers import UsersSerializer

from .models import Friendship


class FriendshipSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's friendship requests."""
    
    from_user = UsersSerializer(read_only=True)
    to_user = UsersSerializer(read_only=True)
    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Friendship
        fields = ['from_user', 'to_user', 'status', 'created_at', 'uid']
    