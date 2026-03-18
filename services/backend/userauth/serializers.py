"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - SiteUserSerializer
    - ProfileSerializer
"""

import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from userprofile.models import Profile
from userprofile.serializers import validate_username

from .models import SiteUser
from friends.models import Friendship

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

def validate_email(value: str, is_creation: bool = False) -> str:
    """Validate and normalize the incomming email address.

    In case of user creation (register), it performs a uniqueness check

    Args:
        value:          the incomming email address
        is_creation:    boolean telling the serializer how to validate
                        depending on context (if creation, enforce unique)

    Returns:
        The validated and normalized email address
    Raises:
        ValidationError: If the email is empty
        ValidationError: If the email is already taken
    """
    if not value:
        raise serializers.ValidationError('Email is required.',
                                            code='MISSING_FIELD')
    value = SiteUser.objects.normalize_email(value)
    if (value.endswith("@gmail.com")):
        value = gmail_specific_normalize(value)
    if is_creation and SiteUser.objects.filter(email=value).exists():
        raise serializers.ValidationError('Email already taken',
                                        code='EMAIL_TAKEN')

    return value

class SiteUserSerializer(serializers.ModelSerializer):
    """Set how to serialize a user (user obj <-> JSON)."""

    profile_username = serializers.CharField()

    class Meta:
        """Defines the metaclass for the SiteUser serializer.
        
        This part tells the rest_framework serializer how to contruct the
        SiteUserSerializer class itself
        """
        model = SiteUser
        fields = ['email', 'password', 'profile_username', 'is_staff', 'is_superuser']
        extra_kwargs = {'password': {
                                'write_only': True
                            },
                        'profile_username': {
                                'validator': [validate_username]
                            }
                        }

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
        
    def create(self, validated_data: dict) -> SiteUser:
        """Overrride the user creation method to ensure it uses our SiteUserManager.

        Args:
            validated_data: the incomming validated json
        Returns:
            The newly created SiteUser
        """
        profile_username = validated_data.pop('profile_username')
        user = SiteUser.objects.create_user(**validated_data)
        Profile.objects.create(user=user,
                               username=profile_username,
                               is_guest=False)
        return user

class LoginSerializer(serializers.ModelSerializer):
    """Specific serializer for logging in."""

    class Meta:
        """Defines the metaclass for the SiteUser serializer.
        
        This part tells the rest_framework serializer how to contruct the
        LoginSerializer class itself
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
        value = validate_email(value, is_creation=False)
        return value

class ComplexPasswordValidator:
    """Define minimal password complexity rules."""

    def validate(self, password: str, user=None) -> None:
        """Define specific validation process for password validation."""
        if (len(password) < 8):
            raise ValidationError("PASSWORD_MIN")

        rules = [
            (r'[0-9]', "PASSWORD_NUMBER"),
            (r'[a-z]', "PASSWORD_LOWERCASE"),
            (r'[A-Z]', "PASSWORD_UPPERCASE"),
            (r'[^A-Za-z0-9]', "PASSWORD_SPECIAL"),
        ]
        for pattern, message in rules:
            if not re.search(pattern, password):
                raise ValidationError('', code=message)
