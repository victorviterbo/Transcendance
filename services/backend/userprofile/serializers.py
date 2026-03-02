
"""Define export of Profile (full and light version) and Freiendship handling."""

from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's profile."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['username', 'image', 'exp_points', 'badges']#, 'created_at']


class LightProfileSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's profile."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['username', 'image']
