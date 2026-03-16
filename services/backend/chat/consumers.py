"""WebSocket consumer logic for public rooms and private direct messages."""

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Room, Message


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Handle chat WebSocket connections, message broadcasts, and status updates."""

    async def connect(self):
        """Accept a socket connection after resolving the room and checking access."""

        url_kwargs = self.scope.get('url_route', {}).get('kwargs', {})
        self.room_name = url_kwargs.get('room_name')

        self.room = await self._resolve_room(self.room_name)

        if self.room_name and self.room is None:
            await self.close(code=4404)
            return

        if self.room is not None and self.room.is_direct:
            is_allowed = await self._is_room_participant()
            if not is_allowed:
                await self.close(code=4403)
                return

        if self.room is not None:
            self.group_name = f'chat_room_{self.room.id}'
        else:
            self.group_name = 'chat_global'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        """Remove the socket from its channel-layer group when disconnecting."""

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
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

        user = self.scope.get('user')
        if user and getattr(user, 'is_authenticated', False):
            return user.username
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
    def _is_room_participant(self):
        """Return whether the authenticated user belongs to the current direct room."""

        user = self.scope.get('user')
        if self.room is None or not user or not getattr(user, 'is_authenticated', False):
            return False
        return self.room.participants.filter(id=user.id).exists()

    @database_sync_to_async
    def _save_message(self, body, room_identifier=None):
        """Persist a message for the authenticated user in the resolved room."""

        user = self.scope.get('user')
        room = self.room
        if room is None and room_identifier is not None:
            room = self._resolve_room(room_identifier)

        if room is None or not user or not getattr(user, 'is_authenticated', False):
            return None

        message = Message.objects.create(
            user=user,
            room=room,
            body=body,
        )
        room.participants.add(user)
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