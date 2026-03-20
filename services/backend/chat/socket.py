"""WebSocket consumer logic for public rooms and private direct messages."""

from channels.db import database_sync_to_async

from .models import Message, Room


class ChatConsumer:
    """Handle chat WebSocket connections, message broadcasts, and status updates."""

    def __init__(self, main_consumer):
        self.main_consumer = main_consumer
        self.scope = main_consumer.scope
        self.channel_layer = main_consumer.channel_layer
        self.room = None
        self.profile = getattr(main_consumer, 'profile', None)
        self.room_name = "default_room"
        self.group_name = f"chat_{self.room_name}"

    async def send_json(self, data):
        await self.main_consumer.send_json(data)

    async def add_to_layer(self, data):
        await self.main_consumer.add_to_layer(data)

    async def remove_from_layer(self, data):
        await self.main_consumer.remove_from_layer(data)

    async def group_send(self, group_name, message):
        await self.main_consumer.group_send(group_name, message)
    
    