"""Define export of Profile (full and light version) and Freiendship handling."""

from io import BytesIO
from typing import Any

from django.core.files.base import ContentFile
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers
from userauth.models import SiteUser
from userauth.serializers import (
    Profile,
    validate_email,
    validate_password,
    validate_username,
)
from userprofile.serializers import LightProfileSerializer, ProfileSerializer


class UsersSerializer(serializers.ModelSerializer):
    """Set how to serialize a user (user obj <-> JSON)."""

    email = serializers.URLField(source='SiteUser.avatar', read_only=True)
    class Meta:
        """Defines the metaclass for the SiteUser serializer.
        
        This part tells the rest_framework serializer how to contruct the
        SiteUserSerializer class itself
        """
        model = Profile
        fields = ['email', 'username', 'avatar', 'exp_points', 'badges', 'created_at', 'is_guest', 'session_key', 'uid']
        read_only_fields = ['exp_points', 'badges', 'created_at', 'is_guest', 'session_key', 'uid']

    def validate_email(self, value: str) -> str:
        """Specific email validation for user login."""
        value = validate_email(value, is_creation=self.context.get('is_creation'))
        return value
    
    def validate_profile_username(self, value: str) -> str:
        """Specific email validation for user login."""
        value = validate_username(value, is_creation=self.context.get('is_creation'))
        return value
    
    def validate_password(self, value: str) -> str:
        """Explicitly trigger the custrom password validator."""
        validate_password(value, user=self.instance)
        return value
