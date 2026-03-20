"""WebSocket consumer logic for public rooms and private direct messages."""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from chat.models import Message, Room
from friends import Friendship

#from chat.socket import ChatConsumer
from userauth.models import SiteUser
from userprofile.models import Profile


class GlobalConsumer(AsyncJsonWebsocketConsumer):
    """Handle chat WebSocket connections, message broadcasts, and status updates."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        self.room = None
        self.profile = None
        self.room_name = "default_room"
        self.group_name = None
        self.chat_group_name = f"chat_{self.room_name}"
    
    async def connect(self):
        self.profile = await self._get_profile_from_scope()
        if not self.profile:
            await self.close(code=4401)
            return
        self.active_layers = set()
        self.group_name = f"user_{self.profile.id}"
        await self.add_to_layer(self.group_name)
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
        if module == "chat":
            await self.chat_subroutine(content)
        elif module == "game":
            await self.game_subroutine(content)
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
    
    async def chat_subroutine(self, content, **kwargs):
        """Process incoming message, delivered, and read actions from the client."""
        action = content.get('action', None)

        if action == 'chat-message':
            body = str(content.get('message', '')).strip()
            if not body:
                await self.send_json({'type': 'error',
                                      'message': 'message is required'})
                return
            msg_obj, response = await self._save_message(body, action, content)
            if not msg_obj:
                await self.send_json(response)
                return

            await self.group_send(f'user_{self.profile.id}', {
                'type': 'chat.message',
                'message_id': msg_obj.id,
                'message': msg_obj.body,
                'sender': self._sender_name(),
                'created': msg_obj.created.isoformat(),
                'delivered': msg_obj.delivered,
                'seen': msg_obj.seen,
            })
            return
        elif action == 'direct-message':
            body = str(content.get('message', '')).strip()
            if not body:
                await self.send_json({'type': 'error',
                                      'message': 'message is required'})
                return
            msg_obj, response = await self._save_message(body, action)
            if not msg_obj:
                await self.send_json(response)
                return

            await self.group_send(f'user_{self.profile.id}', {
                'type': 'chat.message',
                'message_id': msg_obj.id,
                'message': msg_obj.body,
                'sender': self._sender_name(),
                'created': msg_obj.created.isoformat(),
                'delivered': msg_obj.delivered,
                'seen': msg_obj.seen,
            })
            return
        elif action in ('delivered', 'read'):
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

            await self.group_send(self.group_name, {
                'type': 'status.update',
                'message_id': int(message_id),
                'action': action,
                'username': self._sender_name(),
            })
            return

        await self.send_json({'type': 'error', 'message': 'unsupported_action'})

    @database_sync_to_async
    def _update_online_status(self, is_online):
        self.profile.is_online = is_online
        self.profile.save(update_fields=['is_online'])
    

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

    def _resolve_room(self): #, room_ref=None
        """Resolve a room from either its numeric id or its string name."""
        """if room_ref is None:
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
        return None"""

    def _is_room_participant(self) -> bool:
        """Return whether profile (user) belongs to the current direct room."""
        if self.room is None or self.profile is None:
            return False
        return self.room.participants.filter(id=self.profile.id).exists()

    @database_sync_to_async
    def _save_message(self, body, action, content):
        """Persist a message for the profile (user) in the resolved room."""
        if action == 'direct-message':
            target_profile = Profile.objects.filter(username=content['target-username'])
            if not target_profile.exists():
                return False, {'type': 'error', 'message': 'Username not found'}
            if not self.user or not self.user.isauthenticated:
                return False, {'type': 'error', 'message': 'Authentication failed'}
            if not (Friendship.objects.filter(from_user=target_profile.user, to_user=self.user).exists() or
                    Friendship.objects.filter(from_user=self.user, to_user=target_profile.user).exists()):
                return False, {'type': 'error', 'message': 'Target is not a friend'}
            id_a, id_b = self.profile.id, target_profile
            min_id, max_id = (id_a, id_b) if id_a < id_b else (id_b, id_a)
            room, created = Room.objects.get_or_create(room_name=f'user_{min_id}_user_{max_id}')
            if created:
                room.add_participants(self.profile)
                room.add_participants(target_profile)
        elif action == 'chat-message':
            if self.profile.game and self.profile.game:
                self.room = self.profile.game.room
                room = self.room
        if room is None or self.profile is None:
            return False, {'type': 'error', 'message': 'An unexpected error occured'}
        
        message = Message.objects.create(
            sender_profile=self.profile,
            room=room,
            body=body,
        )

        room.participants.add(self.profile)
        return message

    @database_sync_to_async
    def _mark_delivered(self, message_id):
        """Mark a room message as delivered if it exists."""
        message = Message.objects.filter(id=message_id).first()
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
