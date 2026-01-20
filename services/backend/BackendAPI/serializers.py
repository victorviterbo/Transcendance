"""This module implements the serialization the backend.

It converts different python objects to JSON and vice-versa, namely:
    - SiteUserSerializer
"""

from rest_framework import serializers

from models import SiteUser


class SiteUserSerializer(serializers.ModelSerializer):
    """Set how to serialize a user (user obj <-> JSON)."""

    class Meta:
        """Defines the metaclass for the SiteUser serializer.
        
        This part tells the rest_framework serializer how to contruct the
        SiteUserSerializer class itself
        """
        model = SiteUser
        fields = ['email', 'password', 'username', 'is_staff', 'is_superuser']
        extra_kwargs = {'password': {'write_only': True}}