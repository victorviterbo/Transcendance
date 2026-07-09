"""Serialization helpers for the friends module."""

from django.templatetags.static import static
from rest_framework import serializers
from rest_framework.request import Request
from userprofile.models import Profile


def avatar_url(instance: Profile, request: Request | None = None) -> str:
    """Return uploaded avatar URL or fallback to the profile default avatar."""
    if instance.avatar:
        avatar_url = instance.avatar.url
    else:
        avatar_url = static(f'default_avatars/default_avatar_{instance.pk % 18}.png')
    if request:
        return request.build_absolute_uri(avatar_url)
    return avatar_url


class FriendInfoSerializer(serializers.ModelSerializer):
    """Serialize a profile as a frontend friend entry."""
    avatar = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    class Meta:
        """Define the friend list payload."""
        model = Profile
        fields = ['uid', 'username', 'avatar', 'exp_points', 'badges', 'created_at', 'status']

    def get_avatar(self, instance: Profile) -> str:
        """Return an absolute avatar URL when possible."""
        request = self.context.get('request')
        return avatar_url(instance, request)

    def get_status(self, instance: Profile) -> str:
        """Map the backend presence flag to the frontend friend status."""
        return 'online' if instance.is_online else 'offline'


class FriendUserSerializer(serializers.ModelSerializer):
    """Serialize a profile for friend requests and search results."""
    avatar = serializers.SerializerMethodField()
    relation = serializers.SerializerMethodField()
    class Meta:
        """Define the user list payload."""
        model = Profile
        fields = ['uid', 'username', 'avatar', 'badges', 'relation']

    def get_avatar(self, instance: Profile) -> str:
        """Return an absolute avatar URL when possible."""
        request = self.context.get('request')
        return avatar_url(instance, request)

    def get_relation(self, instance: Profile) -> str:
        """Return the computed relation for the serialized profile."""
        return self.context.get('relation', 'not-friends')
    