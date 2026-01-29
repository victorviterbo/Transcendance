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
        fields = ['email', 'username', 'is_staff', 'is_superuser']
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
        if email.count("@") != 1:
            raise ValueError("Invalid Email Address")
        if (email.startswith("+")):
            raise ValueError("Invalid Gmail Address")
        name, domain = email.split("@")
        name = name.replace(".", "")
        name = name.split("+")[0]
        return ("@").join([name, domain])


    def validate_email(self, value):
        value = SiteUser.objects.normalize_email(value)
        if (value.endswith("@gmail.com")):
            try:
                value = self.gmail_specific_normalize(value)
            except ValueError as e:
                raise serializers.ValidationError(f"Gmail normalization failed: {e}") from e
        if SiteUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already taken.")
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
