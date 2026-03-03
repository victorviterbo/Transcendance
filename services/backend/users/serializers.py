"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - SiteUserSerializer
    - ProfileSerializer
"""

from typing import Any

from rest_framework import serializers

from .models import Profile, SiteUser


def gmail_specific_normalize(email: str) -> str:
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

def validate_email(value: str) -> str:
    """Validate and normalize the incomming email address.

    In case of user creation (register), it performs a uniqueness check

    Args:
        value: the incomming email address
    Returns:
        The validated and normalized email address
    Raises:
        ValidationError: If the email is empty
        ValidationError: If the email is already taken
    """
    if not value:
        raise serializers.ValidationError('Email is required.',
                                            code='invalid-data')
    value = SiteUser.objects.normalize_email(value)
    if (value.endswith("@gmail.com")):
        value = gmail_specific_normalize(value)
    return value

def validate_username(value: str) -> str:
    """Validate and normalize the incomming username.

    Args:
        value: the incomming email username
    Returns:
        The validated and normalized username
    Raises:
        ValidationError: If the username is empty
        ValidationError: If the username is already taken
    """
    if not value: 
        raise serializers.ValidationError('Username is required.',
                                            code='invalid-data')
    return value

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
    
    def validate_email(self, value: str) -> str:
        """Specific email validation for user creation / update."""
        value = validate_email(value)
        if value is not None and SiteUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already taken',
                                              code='unique')
        return value
    
    def validate_username(self, value: str) -> str:
        """Specific username validation for user creation / update."""
        username = validate_username(value)
        if username is not None and SiteUser.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken',
                                              code='unique')
        return value
    
    def create(self, validated_data: Any) -> SiteUser:
        """Overrride the user creation method to ensure it uses our SiteUserManager.

        Args:
            validated_data: the incomming validated json
        Returns:
            The newly created SiteUser
        """
        return SiteUser.objects.create_user(**validated_data)

class LoginSerializer(serializers.ModelSerializer):
    """Specific serializer for logging in."""

    class Meta:
        """Defines the metaclass for the SiteUser serializer.
        
        This part tells the rest_framework serializer how to contruct the
        SiteUserSerializer class itself
        """
        model = SiteUser
        fields = ['email', 'password']
        extra_kwargs = {'password': {'write_only': True},
                        'email': {
                            'validators': []
                            }
                        }
    
    def validate_email(self, value: str) -> str:
        """Specific email validation for user login."""
        value = validate_email(value)
        return value


class ProfileSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's profile (user profile obj <-> JSON)."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['image']
