"""WebSocket consumer logic for public rooms and private direct messages."""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import Message, Room


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Handle chat WebSocket connections, message broadcasts, and status updates."""

    async def ChatSubroutine(self, content, **kwargs):
        """Process incoming message, delivered, and read actions from the client."""
        action = content.get('action', 'message')

        if action == 'message':
            body = str(content.get('message', '')).strip()
            if not body:
                await self.send_json({'type': 'error', 'message': 'message is required'})
                return

            msg_obj = await self._save_message(body, self.room_name)
            if not msg_obj:
                await self.send_json({'type': 'error', 'message': 'save_failed'})
                return

            await self.channel_layer.group_send(self.group_name, {
                'type': 'chat.message',
                'message_id': msg_obj.id,
                'message': msg_obj.body,
                'sender': self._sender_name(),
                'created': msg_obj.created.isoformat(),
                'delivered': msg_obj.delivered,
                'seen': msg_obj.seen,
            })
            return

        if action in ('delivered', 'read'):
            message_id = content.get('message_id')
            if not message_id:
                await self.send_json({'type': 'error', 'message': 'message_id is required'})
                return

            if action == 'delivered':
                changed = await self._mark_delivered(message_id)
            else:
                changed = await self._mark_seen(message_id)

            if not changed:
                await self.send_json({'type': 'error', 'message': 'message_not_found'})
                return

            await self.channel_layer.group_send(self.group_name, {
                'type': 'status.update',
                'message_id': int(message_id),
                'action': action,
                'username': self._sender_name(),
            })
            return

        await self.send_json({'type': 'error', 'message': 'unsupported_action'})

    async def chat_message(self, event):
        """Forward a chat message event to the connected client."""
        await self.send_json({
            'type': 'chat_message',
            'group': self.group_name,
            'sender': event['sender'],
            'message': event['message'],
            'message_id': event.get('message_id'),
            'created': event.get('created'),
            'delivered': event.get('delivered'),
            'seen': event.get('seen'),
        })

    async def status_update(self, event):
        """Forward a delivery or read status update to the connected client."""
        await self.send_json({
            'type': 'status_update',
            'message_id': event['message_id'],
            'action': event['action'],
            'username': event['username'],
        })

    def _sender_name(self):
        """Return the authenticated sender username or an anonymous fallback."""
        if self.profile:
            return self.profile.username
        return 'anonymous'

    @database_sync_to_async
    def _resolve_room(self, room_ref=None):
        """Resolve a room from either its numeric id or its string name."""
        if room_ref is None:
            return None

        try:
            room_id = int(room_ref)
            room = Room.objects.filter(id=room_id).first()
            if room:
                return room
        except (TypeError, ValueError):
            pass

        if room_ref:
            return Room.objects.filter(name=room_ref).first()
        return None

    @database_sync_to_async
    def _is_room_participant(self) -> bool:
        """Return whether profile (user) belongs to the current direct room."""
        if self.room is None or self.profile is None:
            return False
        return self.room.participants.filter(id=self.profile.id).exists()

    @database_sync_to_async
    def _save_message(self, body, room_identifier=None):
        """Persist a message for the profile (user) in the resolved room."""
        room = self.room
        if room is None and room_identifier is not None:
            room = self._resolve_room(room_identifier)

        if room is None or self.profile is None:
            return None

        message = Message.objects.create(
            user=self.profile,
            room=room,
            body=body,
        )
        room.participants.add(self.profile)
        self.room = room
        return message

    @database_sync_to_async
    def _mark_delivered(self, message_id):
        """Mark a room message as delivered if it exists."""
        message = Message.objects.filter(id=message_id, room=self.room).first()
        if not message:
            return False
        if not message.delivered:
            message.delivered = True
            message.save(update_fields=['delivered'])
        return True

    @database_sync_to_async
    def _mark_seen(self, message_id):
        """Mark a room message as seen and delivered if it exists."""
        message = Message.objects.filter(id=message_id, room=self.room).first()
        if not message:
            return False
        changed = False
        if not message.delivered:
            message.delivered = True
            changed = True
        if not message.seen:
            message.seen = True
            changed = True
        if changed:
            message.save(update_fields=['delivered', 'seen'])
        return True
