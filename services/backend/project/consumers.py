"""WebSocket consumer logic for public rooms and private direct messages."""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from services.backend.chat.socket import ChatConsumer
from userauth.models import SiteUser
from userprofile.models import Profile


class GlobalConsumer(AsyncJsonWebsocketConsumer):
    """Handle chat WebSocket connections, message broadcasts, and status updates."""

    async def connect(self):
        self.profile = await self._get_profile_from_scope()
        if not self.profile:
            await self.close(code=4401)
            return
        self.active_layers = set()
        self.chat_handler = ChatConsumer(self)
        await self.add_to_layer(f"user_{self.profile.id}")
        await self._update_online_status(is_online=True)
        await self.accept()
        return

    async def disconnect(self, close_code):
        """Remove the socket from its channel-layer group when disconnecting."""
        for layer in self.active_layers:
            await self.channel_layer.group_discard(layer, self.channel_name)
        await self._update_online_status(False)
        return
    
    async def receive_json(self, content):
        module = content.get("module")
        print("hello")
        if module == "chat":
            await self.chat_handler.chat_subroutine(content)
        elif module == "game":
            await self.handle_game_subroutine(content)
        else:
            await self.close(code=4405)
        return
    async def add_to_layer(self, group_name):
        await self.channel_layer.group_add(group_name, self.channel_name)
        self.active_layers.add(group_name)

    async def remove_from_layer(self, group_name):
        await self.channel_layer.group_discard(group_name, self.channel_name)
        self.active_layers.remove(group_name)

    async def group_send(self, group_name, message):
        await self.channel_layer.group_send(group_name, message)

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
        return Profile.objects.create() # TODO: remove in prod: Should not happen: it would mean we have websocket connection before http connection

    @database_sync_to_async
    def _update_online_status(self, is_online):
        self.profile.is_online = is_online
        self.profile.save(update_fields=['is_online'])
    