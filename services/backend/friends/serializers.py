"""Serialization helpers for the friends module."""

from django.templatetags.static import static
from rest_framework import serializers
from rest_framework.request import Request

from userprofile.models import Profile
from userprofile.serializers import UsersSerializer

from .models import Friendship


def _build_avatar_url(instance: Profile, request: Request | None = None) -> str:
    """Return uploaded avatar URL or fallback to the profile default avatar."""

    if instance.avatar:
        avatar_url = instance.avatar.url
    else:
        avatar_url = static(f'default_avatars/default_avatar_{instance.pk % 18}.png')

    if request:
        return request.build_absolute_uri(avatar_url)
    return avatar_url


class FriendshipSerializer(serializers.ModelSerializer):
    """Serialize a friendship row for debugging and legacy responses."""

    from_user = UsersSerializer(source='from_user.profile', read_only=True)
    to_user = UsersSerializer(source='to_user.profile', read_only=True)

    class Meta:
        """Define the serialized friendship fields."""

        model = Friendship
        fields = ['from_user', 'to_user', 'status', 'created_at', 'uid']


class FriendInfoSerializer(serializers.ModelSerializer):
    """Serialize a profile as a frontend friend entry."""

    image = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        """Define the friend list payload."""

        model = Profile
        fields = ['uid', 'username', 'image', 'exp_points', 'badges', 'created_at', 'status']

    def get_image(self, instance: Profile) -> str:
        """Return an absolute avatar URL when possible."""

        request = self.context.get('request')
        return _build_avatar_url(instance, request)

    def get_status(self, instance: Profile) -> str:
        """Map the backend presence flag to the frontend friend status."""

        return 'online' if instance.is_online else 'offline'


class FriendUserSerializer(serializers.ModelSerializer):
    """Serialize a profile for friend requests and search results."""

    image = serializers.SerializerMethodField()
    relation = serializers.SerializerMethodField()

    class Meta:
        """Define the user list payload."""

        model = Profile
        fields = ['uid', 'username', 'image', 'badges', 'relation']

    def get_image(self, instance: Profile) -> str:
        """Return an absolute avatar URL when possible."""

        request = self.context.get('request')
        return _build_avatar_url(instance, request)

    def get_relation(self, instance: Profile) -> str:
        """Return the computed relation for the serialized profile."""

        return self.context.get('relation', 'not-friends')
    