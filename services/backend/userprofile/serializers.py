
"""Define export of Profile (full and light version) and Freiendship handling."""

from rest_framework import serializers

from .models import Profile

from typing import Any

def validate_username(value: str, is_creation=False) -> str:
    """Validate and normalize the incomming username.

    Args:
        value: the incomming username
    Returns:
        The validated and normalized username
    Raises:
        ValidationError: If the username is empty
        ValidationError: If the username is already taken
    """
    if not value: 
        raise serializers.ValidationError('Username is required.',
                                          code='invalid-data')
    if is_creation and Profile.objects.filter(username=value).exists():
        raise serializers.ValidationError('Username already taken',
                                          code='unique')
    return value

class ProfileSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's profile."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['username', 'image', 'exp_points', 'badges', 'created_at']

    def validate_username(self, value: str, is_creation=False) -> str:
        """Specific username validation for user creation / update."""
        if is_creation and Profile.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken',
                                              code='unique')
        return validate_username(value)

class LightProfileSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's profile."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['username', 'image']
