"""Serialization helpers for the friends module."""

from rest_framework import serializers

from userprofile.models import Profile
from userprofile.serializers import UsersSerializer

from .models import Friendship


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
        if instance.avatar and request:
            return request.build_absolute_uri(instance.avatar.url)
        if instance.avatar:
            return instance.avatar.url
        return ''

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
        if instance.avatar and request:
            return request.build_absolute_uri(instance.avatar.url)
        if instance.avatar:
            return instance.avatar.url
        return ''

    def get_relation(self, instance: Profile) -> str:
        """Return the computed relation for the serialized profile."""

        return self.context.get('relation', 'not-friends')
    