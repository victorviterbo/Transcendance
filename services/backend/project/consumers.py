"""WebSocket consumer logic for public rooms and private direct messages."""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from chat.consumers.ChatConsumer import ChatSubroutine
from userauth.models import SiteUser
from userprofile.models import Profile


class GlobalConsumer(AsyncJsonWebsocketConsumer):
    """Handle chat WebSocket connections, message broadcasts, and status updates."""

    async def connect(self):
        self.profile = await self._get_profile_from_scope()
        if not self.profile:
            await self.close(code=4401)
            return
        self.active_rooms = set()
        await self.update_status(online=True)
        await self.accept()
        return

    async def disconnect(self, close_code):
        """Remove the socket from its channel-layer group when disconnecting."""
        for room_group in self.joined_rooms:
            await self.channel_layer.group_discard(room_group, self.channel_name)
        await self.channel_layer.group_discard(self.private_group, self.channel_name)
        await self._update_online_status(False)
        return
    
    async def receive_json(self, content):
        module = content.get("module")

        if module == "chat":
            await ChatSubroutine(content)
        elif module == "game":
            await self.handle_game_subroutine(content)
        return

    @database_sync_to_async
    def _get_profile_from_scope(self):
        """Custom helper to find the Profile identity for a WebSocket connection."""
        user = self.scope.get('user')
        if user and isinstance(user, SiteUser) and user.is_authenticated:
            try:
                return user.profile 
            except Profile.DoesNotExist:
                return None
        profile = self.scope.get('profile')
        if isinstance(profile, Profile):
            return profile
        session = self.scope.get('session', {})
        guest_id = session.get('guest_profile_id')
        if guest_id:
            return Profile.objects.filter(id=guest_id, is_guest=True).first()
        return None

    @database_sync_to_async
    def _update_online_status(self, is_online):
        self.profile.is_online = is_online
        self.profile.save(update_fields=['is_online'])