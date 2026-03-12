
"""Define export of Profile (full and light version) and Freiendship handling."""
from io import BytesIO
from typing import Any

from django.core.files.base import ContentFile
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers

from .models import Profile


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
                                          code='invalid-data')
    if any(pattern in value for pattern in ['/', '\\', '..', '~']):
        raise serializers.ValidationError('Use of forbiden character', code='FORBIDDEN')
    if value == 'admin':
        raise serializers.ValidationError('Who do you think you are ?', code='RESERVED')
    if is_creation and Profile.objects.filter(username=value).exists():
        raise serializers.ValidationError('Username already taken', code='UNIQUE')
    return value

class LightProfileSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's profile."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['username', 'image', 'is_guest', 'session_key']
        read_only_fields = ['is_guest', 'session_key']

    def validate_username(self, value: str, is_creation: bool = False) -> str:
        """Specific username validation for user creation / update."""
        if self.context.get('is_creation'):
            is_creation = True
        if is_creation and Profile.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken',
                                              code='unique')
        return validate_username(value)

    def validate_image(self, data: Any) -> Any:
        """Convert to PNG and resize image."""
        if not data:
            return data
        try:
            img = Image.open(data)
        except UnidentifiedImageError as e:
            raise serializers.ValidationError('Invalid image file.') from e
        except (ValueError, TypeError) as e:
            raise serializers.ValidationError('The image file is corrupted or empty.',
                                              code='corrupt_image') from e
        img = img.convert('RGBA')
        img.thumbnail((300, 300))
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        username = self.initial_data.get('username', 'profile')
        return ContentFile(buffer.getvalue(), name=f'{username}_profile.png')

    def to_representation(self, instance: Profile) -> dict:
        """Define how the Profile is exported to json."""
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            ret['image'] = request.build_absolute_uri(instance.image.url)
        return ret

class ProfileSerializer(LightProfileSerializer):
    """Set how to serialize a user's profile."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['username', 'image', 'exp_points', 'badges', 'created_at']
        read_only_fields = ['exp_points', 'badges', 'is_guest', 'session_key']
