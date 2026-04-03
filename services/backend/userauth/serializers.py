"""This module implements the serialization the backend.

After validation if needed, it converts different python objects
to JSON and vice-versa, namely:
    - SiteUserSerializer
"""

from django.contrib.auth.password_validation import validate_password
from project.validators import validate_email, validate_username
from rest_framework import serializers
from userprofile.models import Profile

from .models import SiteUser


class RegisterSerializer(serializers.ModelSerializer):
    """Set how to serialize a user (user obj <-> JSON)."""

    profile_username = serializers.CharField()

    class Meta:
        """Defines the metaclass for the SiteUser serializer.
        
        This part tells the rest_framework serializer how to contruct the
        SiteUserSerializer class itself
        """
        model = SiteUser
        fields = ['email', 'password', 'profile_username',
                  'is_staff', 'is_superuser', 'uid']
        extra_kwargs = {'password': {
                                'write_only': True
                            },
                        'uid': {
                                'read_only': True
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
        request = self.context.get('request')
        user = SiteUser.objects.create_user(**validated_data)
        guest_profile = getattr(request, 'profile', None)
        if guest_profile and guest_profile.is_guest:
            guest_profile.user = user
            guest_profile.username = profile_username
            guest_profile.is_guest = False
            guest_profile.save()
        else:
            Profile.objects.create(user=user,
                                   username=profile_username,
                                   is_guest=False) #TODO remove: should not happen
        return user

class LoginSerializer(serializers.ModelSerializer):
    """Specific serializer for logging in."""

    class Meta:
        """Defines the metaclass for the SiteUser serializer.
        
        This part tells the rest_framework serializer how to contruct the
        LoginSerializer class itself
        """
        model = SiteUser
        fields = ['email', 'password', 'uid']
        extra_kwargs = {'password': {'write_only': True},
                        'email': {
                            'validators': []
                            }
                        }
    
    def validate_email(self, value: str) -> str:
        """Specific email validation for user login."""
        value = validate_email(value, is_creation=False)
        return value

