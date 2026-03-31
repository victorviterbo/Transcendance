"""Define export of Profile (full and light version) and Freiendship handling."""

from io import BytesIO
from typing import Any

from django.core.files.base import ContentFile
from PIL import Image, UnidentifiedImageError
from project.validators import validate_email, validate_username
from rest_framework import serializers

from .models import Profile


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
    
    def validate_username(self, value: str) -> str:
        """Specific email validation for user login."""
        value = validate_username(value, is_creation=self.context.get('is_creation'))
        return value
    
class LightProfileSerializer(serializers.ModelSerializer):
    """Set how to serialize a user's profile."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['username', 'avatar', 'is_guest', 'session_key']
        read_only_fields = ['is_guest', 'session_key', 'uid']

    def validate_username(self, value: str, is_creation: bool = False) -> str:
        """Specific username validation for user creation / update."""
        if self.context.get('is_creation'):
            is_creation = True
        if is_creation and Profile.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken',
                                              code='USERNAME_TAKEN')
        return validate_username(value)

    def validate_avatar(self, data: Any) -> Any:
        """Convert to PNG and resize avatar."""
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
        if instance.avatar and request:
            ret['avatar'] = request.build_absolute_uri(instance.avatar.url)
        return ret

class ProfileSerializer(LightProfileSerializer):
    """Set how to serialize a user's profile."""

    class Meta:
        """Defines the metaclass for the Profile serializer.
        
        This part tells the rest_framework serializer how to contruct the
        ProfileSerializer class itself
        """
        model = Profile
        fields = ['username', 'avatar', 'exp_points', 'badges', 'created_at',]
        read_only_fields = ['exp_points', 'badges', 'is_guest', 'session_key', 'uid']
