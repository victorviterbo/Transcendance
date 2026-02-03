"""This module implements the serialization the backend.

It converts different python objects to JSON and vice-versa, namely:
    - SiteUserSerializer
    - ProfileSerializer
"""

from rest_framework import serializers
from .models import SiteUser, Profile

class SiteUserSerializer(serializers.ModelSerializer):
    """Set how to serialize a user (user obj <-> JSON)."""

    class Meta:
        """Defines the metaclass for the SiteUser serializer.
        
        This part tells the rest_framework serializer how to contruct the
        SiteUserSerializer class itself
        """
        model = SiteUser
        fields = ['email', 'username', 'password', 'is_staff', 'is_superuser']
        extra_kwargs = {'password': {'write_only': True}}
    
    def gmail_specific_normalize(self, email: str) -> str:
        """Normalizes a Gmail address.
        
        It removed dots (which are ingored by Gmail) and
        plus-suffixes (which are used to create dummy aliases on gmail).

        Args:
            email: the Django-Normalized Gmail address
        Returns:
            The normalized Gmail address ensuring uniqueness from Gmail viewpoint
        Raises:
            ValueError: If the email does not contain exactly one '@' symbol
            ValueError: If the email startswith '+' (forbidden by Gmail)
        """
        name, domain = email.split("@")
        name = name.replace(".", "")
        name = name.split("+")[0]
        return ("@").join([name, domain])

    def validate_email(self, value):
        
        if not value:
            raise serializers.ValidationError('Username is required.', code='invalid-data')
        value = SiteUser.objects.normalize_email(value)
        if (value.endswith("@gmail.com")):
            value = self.gmail_specific_normalize(value)
        if self.instance is None:
            if SiteUser.objects.filter(email=value).exists():
                raise serializers.ValidationError('Email already taken', code='already-used')
        return value

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError('Username is required.', code='invalid-data')
        if self.instance is None:
            if SiteUser.objects.filter(username=value).exists():
                raise serializers.ValidationError('Username already taken', code='already-used')
        return value
    
    def create(self, validated_data):
            print(validated_data)
            return SiteUser.objects.create_user(**validated_data)

class ProfileSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's profile (user profile obj <-> JSON)."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['image']
