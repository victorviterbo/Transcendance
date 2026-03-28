"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - Friendship
"""
from rest_framework import serializers

from .models import Friendship


class FriendshipSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's friendship requests."""
    
    from_user = serializers.ReadOnlyField(source='from_user.profile.username')
    to_user = serializers.ReadOnlyField(source='to_user.profile.username')
    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Friendship
        fields = ['from_user', 'to_user', 'status', 'created_at']