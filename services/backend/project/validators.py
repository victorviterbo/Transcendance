

import re

from django.core.exceptions import ValidationError
from rest_framework import serializers
from userauth.models import SiteUser
from userprofile.models import Profile


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


def validate_username(value: str, is_creation: bool = False) -> str:
    """Validate and normalize the incomming username.

    Args:
        value:          the incomming username
        is_creation:    flag about the context of serialization
    Returns:
        The validated and normalized username
    Raises:
        ValidationError: If the username is empty
        ValidationError: If the username is already taken
    """
    if not value:
        raise serializers.ValidationError('Username is required.',
                                          code='INVALID_USERNAME')
    if any(pattern in value for pattern in ['/', '\\', '..', '~']):
        raise serializers.ValidationError('Use of forbiden character',
                                          code='USERNAME_FORBIDDEN_CHAR')
    if value.lower() == 'admin':
        raise serializers.ValidationError('Who do you think you are ?',
                                          code='RESERVED_USERNAME')
    if is_creation and Profile.objects.filter(username=value).exists():
        raise serializers.ValidationError('Username already taken',
                                          code='USERNAME_TAKEN')
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
