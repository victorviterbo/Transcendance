"""WebSocket consumer logic for user presence (online/offline)."""

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .consumers_utils import ConsumerScopeUtils


class PresenceConsumer(ConsumerScopeUtils, AsyncJsonWebsocketConsumer):
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
