"""WebSocket consumer logic for user presence (online/offline)."""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from userauth.models import SiteUser
from userprofile.models import Profile

from .redis_utils import RedisManager


class PresenceConsumer(AsyncJsonWebsocketConsumer):
    """Track user online/offline state and broadcast status changes.

    Flow summary:
    - connect: identify profile, join presence group, mark online, broadcast online
    - receive_json: refresh TTL on ping
    - disconnect: mark offline and broadcast offline
    """

    async def connect(self) -> None:
        """Authenticate socket context and announce the user as online."""
        # Resolve who is connecting from scope (user/profile/session).
        self.profile = await self._get_profile_from_scope()
        if not self.profile:
            # 4401: unauthorized websocket connection.
            await self.close(code=4401)
            return

        # All presence clients listen to one group for status updates.
        self.presence_group_name = "presence_updates"
        await self.channel_layer.group_add(self.presence_group_name, self.channel_name)

        # Persist current online state in Redis with TTL.
        await self.mark_user_online()

        # Accept only after identity and presence state are ready.
        await self.accept()

        # Notify all connected clients that this user is now online.
        await self.channel_layer.group_send(
            self.presence_group_name,
            {
                "type": "user_status",
                "username": self.profile.username,
                "status": "online",
                "user_id": self.profile.id,
            },
        )

    async def disconnect(self, close_code) -> None:
        """Cleanup connection state and announce user as offline."""
        # If profile exists, remove presence key then broadcast offline event.
        if getattr(self, "profile", None):
            await self.mark_user_offline()
            await self.channel_layer.group_send(
                self.presence_group_name,
                {
                    "type": "user_status",
                    "username": self.profile.username,
                    "status": "offline",
                    "user_id": self.profile.id,
                },
            )

        # Always remove this socket from presence broadcast group.
        if getattr(self, "presence_group_name", None):
            await self.channel_layer.group_discard(
                self.presence_group_name,
                self.channel_name,
            )

    async def receive_json(self, content) -> None:
        """Handle client messages. Currently supports heartbeat ping only.Maybe will change it later"""
        action = content.get("action")
        if action == "ping":
            # Refresh TTL so the user stays online while socket is active.
            await self.mark_user_online()
            await self.send_json({"type": "pong"})
            return

        # Explicit error response helps frontend debugging.
        await self.send_json({"type": "error", "message": "unsupported_action"})

    async def user_status(self, event) -> None:
        """Forward channel-layer presence events to this websocket client."""
        await self.send_json(
            {
                "type": "user_status",
                "username": event["username"],
                "status": event["status"],
                "user_id": event["user_id"],
            }
        )

    @database_sync_to_async
    def _get_profile_from_scope(self) -> Profile | None:
        """Resolve profile from socket scope.

        Priority:
        1) Authenticated SiteUser.profile
        2) Middleware-injected Profile in scope
        3) guest_profile_id from session
        """
        user = self.scope.get("user")
        if user and isinstance(user, SiteUser) and user.is_authenticated:
            try:
                return user.profile
            except Profile.DoesNotExist:
                return None

        # Optional profile attached by middleware.
        profile = self.scope.get("profile")
        if isinstance(profile, Profile):
            return profile

        # Guest fallback from session key.
        session = self.scope.get("session", {})
        guest_uid = session.get("guest_profile_uid")
        if guest_uid:
            return Profile.objects.filter(uid=guest_uid, is_guest=True).first()

        return None

    async def mark_user_online(self) -> None:
        """Store online marker in Redis with short TTL for auto-expiry."""
        await RedisManager.set_user_online(self.profile.id, ttl=60)

    async def mark_user_offline(self) -> None:
        """Remove online marker in Redis when connection ends."""
        await RedisManager.set_user_offline(self.profile.id)
