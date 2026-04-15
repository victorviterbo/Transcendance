"""WebSocket consumer logic for user presence (online/offline)."""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from project.consumers_utils import ConsumerScopeUtils


class PresenceConsumer(ConsumerScopeUtils, AsyncJsonWebsocketConsumer):
    """Track user online/offline state and broadcast status changes."""

    async def connect(self) -> None:
        """Authenticate socket context and announce the user as online."""
        self.profile = await self._get_profile_from_scope()
        if not self.profile:
            await self.close(code=4401)
            return

        self.presence_group_name = "presence_updates"
        await self.channel_layer.group_add(self.presence_group_name, self.channel_name)

        await self.mark_user_online()
        await self._update_online_status(is_online=True)
        await self.accept()

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
        if getattr(self, "profile", None):
            await self.mark_user_offline()
            await self._update_online_status(is_online=False)
            await self.channel_layer.group_send(
                self.presence_group_name,
                {
                    "type": "user_status",
                    "username": self.profile.username,
                    "status": "offline",
                    "user_id": self.profile.id,
                },
            )

        if getattr(self, "presence_group_name", None):
            await self.channel_layer.group_discard(
                self.presence_group_name,
                self.channel_name,
            )

    async def receive_json(self, content) -> None:
        """Handle client messages. Currently supports heartbeat ping only."""
        action = content.get("action")
        if action == "ping":
            await self.mark_user_online()
            await self._update_online_status(is_online=True)
            await self.send_json({"type": "pong"})
            return

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
    def _update_online_status(self, is_online: bool) -> None:
        """Persist live websocket status on the profile model."""
        self.profile.is_online = is_online
        self.profile.save(update_fields=['is_online'])
