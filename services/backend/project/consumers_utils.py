"""Shared utilities for websocket consumers."""

from channels.db import database_sync_to_async

from userauth.models import SiteUser
from userprofile.models import Profile

from .redis_utils import RedisManager


class ConsumerScopeUtils:
    """Shared scope/profile and presence helpers for websocket consumers."""

    create_profile_if_missing = False

    @database_sync_to_async
    def _get_profile_from_scope(self) -> Profile | None:
        """Resolve profile from user, injected scope profile, or guest session."""
        self.user = self.scope.get("user")
        if self.user and isinstance(self.user, SiteUser) and self.user.is_authenticated:
            try:
                return self.user.profile
            except Profile.DoesNotExist:
                return None

        profile = self.scope.get("profile")
        if isinstance(profile, Profile):
            return profile

        session = self.scope.get("session", {})
        guest_uid = session.get("guest_profile_uid")
        if guest_uid:
            return Profile.objects.filter(uid=guest_uid, is_guest=True).first()

        guest_id = session.get("guest_profile_id")
        if guest_id:
            return Profile.objects.filter(id=guest_id, is_guest=True).first()

        if self.create_profile_if_missing:
            return Profile.objects.create()

        return None

    async def mark_user_online(self, ttl: int = 60) -> None:
        """Store online marker in Redis with TTL for auto-expiry."""
        if getattr(self, "profile", None):
            await RedisManager.set_online(self.profile.id, ttl=ttl)

    async def mark_user_offline(self) -> None:
        """Remove online marker from Redis."""
        if getattr(self, "profile", None):
            await RedisManager.set_offline(self.profile.id)
