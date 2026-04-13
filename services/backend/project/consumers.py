"""WebSocket consumer logic for public rooms and private direct messages."""

import uuid

from channels.db import database_sync_to_async
from channels.generic.websocket import (
    AsyncJsonWebsocketConsumer,
    AsyncWebsocketConsumer,
)
from chat.models import Message, Room
from friends.models import Friendship
from game.models import Game
from game.ws_handlers import handle_game_action
from userauth.models import SiteUser
from userprofile.models import Profile


class GlobalConsumer(AsyncJsonWebsocketConsumer):
    """Handle chat WebSocket connections, message broadcasts, and status updates."""
    
    def __init__(self, *args: tuple, **kwargs: dict) -> None:
        """Define initialisation of consumer class."""
        super().__init__(*args, **kwargs)
        
        self.room = None
        self.profile = None
        self.room_name = "default_room"
        self.group_name = None
        self.chat_group_name = f"chat_{self.room_name}"
    
    async def connect(self) -> None:
        """Define process upon client connection to websocket."""
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

    async def disconnect(self, close_code: int) -> None:
        """Remove the socket from its channel-layer group when disconnecting."""
        for layer in self.active_layers:
            await self.channel_layer.group_discard(layer, self.channel_name)
        await self._update_online_status(False)
        return
    
    async def receive_json(self, content: dict) -> None:
        """Receive websocket framework and reroute it to the appropriate module."""
        module = content.get("module")
        if module == "chat":
            await self.chat_subroutine(content)
        elif module == "game":
            await handle_game_action(self, content)
        else:
            await self.close(code=4405)
        return
    
    async def add_to_layer(self, group_name: str) -> None:
        """Add layer to subscribed channels."""
        await self.channel_layer.group_add(group_name, self.channel_name)
        self.active_layers.add(group_name)

    async def remove_from_layer(self, group_name: str) -> None:
        """Remove layer from subscribed channels."""
        await self.channel_layer.group_discard(group_name, self.channel_name)
        self.active_layers.remove(group_name)

    async def group_send(self, group_name: str, message: dict) -> None:
        """Send a message to the specified channel."""
        await self.channel_layer.group_send(group_name, message)

    @database_sync_to_async
    def _get_profile_from_scope(self) -> Profile:
        """Custom helper to find the Profile identity for a WebSocket connection."""
        self.user = self.scope.get('user')
        if self.user and isinstance(self.user, SiteUser) and self.user.is_authenticated:
            try:
                return self.user.profile
            except Profile.DoesNotExist:
                return None
        profile = self.scope.get('profile')
        if isinstance(profile, Profile):
            return profile
        session = self.scope.get('session', {})
        guest_id = session.get('guest_profile_id')
        if guest_id:
            return Profile.objects.filter(id=guest_id, is_guest=True).first()
        # Create unique guest profile
        import uuid
        guest_username = f"guest_{uuid.uuid4().hex[:8]}"
        return Profile.objects.create(username=guest_username, is_guest=True)
    
    async def chat_subroutine(self, content: dict, **kwargs: dict) -> None:
        """Process incoming message, delivered, and read actions from the client."""
        action = content.get('action')

        if action == 'chat-message':
            body = str(content.get('message', '')).strip()
            if not body:
                await self.send_json({'type': 'error',
                                      'message': 'message is required'})
                return
            success, message = await self._save_message(body, action, content)
            if not success:
                await self.send_json(message)
                return

            await self.group_send(f'user_{self.profile.id}', {
                'type': 'chat.message',
                'message_uid': message.uid,
                'message': message.body,
                'sender': self._sender_name(),
                'created': message.created.isoformat(),
                'delivered': message.delivered,
                'seen': message.seen,
            })
            return
        elif action == 'direct-message':
            body = str(content.get('message', '')).strip()
            if not body:
                await self.send_json({'type': 'error',
                                      'message': 'message is required'})
                return
            success, message = await self._save_message(body, action, content)
            if not success:
                await self.send_json(message)
                return

            await self.group_send(f'user_{self.profile.id}', {
                'type': 'chat.message',
                'message_id': message.id,
                'message': message.body,
                'sender': self._sender_name(),
                'created': message.created.isoformat(),
                'delivered': message.delivered,
                'seen': message.seen,
            })
            return
        elif action in ('delivered', 'read'):
            message_id = content.get('message_id')
            if not message_id:
                await self.send_json({'type': 'error',
                                      'message': 'message_id is required'})
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
    def _update_online_status(self, is_online: bool) -> None:
        self.profile.is_online = is_online
        self.profile.save(update_fields=['is_online'])
    

    async def chat_message(self, event: dict) -> None:
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

    async def status_update(self, event: dict) -> None:
        """Forward a delivery or read status update to the connected client."""
        await self.send_json({
            'type': 'status_update',
            'message_id': event['message_id'],
            'action': event['action'],
            'username': event['username'],
        })

    # Game event handlers
    async def game_player_joined(self, event: dict) -> None:
        """Notify of a player joining the game room."""
        await self.send_json({
            'type': 'game_event',
            'event': 'player_joined',
            'player_name': event['player_name'],
            'player_id': event['player_id'],
        })

    async def game_game_started(self, event: dict) -> None:
        """Notify that the game has started."""
        await self.send_json({
            'type': 'game_event',
            'event': 'game_started',
            'started_by': event['started_by'],
            'room_id': event.get('room_id'),
        })

    async def game_track_revealed(self, event: dict) -> None:
        """Notify of a track being revealed."""
        await self.send_json({
            'type': 'game_event',
            'event': 'track_revealed',
            'track': event['track'],
            'room_id': event.get('room_id'),
        })

    async def game_answer_submitted(self, event: dict) -> None:
        """Notify of an answer submission."""
        await self.send_json({
            'type': 'game_event',
            'event': 'answer_submitted',
            'player_name': event['player_name'],
            'player_id': event['player_id'],
            'answer': event['answer'],
            'is_correct': event['is_correct'],
        })

    async def game_player_left(self, event: dict) -> None:
        """Notify of a player leaving the game room."""
        await self.send_json({
            'type': 'game_event',
            'event': 'player_left',
            'player_name': event['player_name'],
            'player_id': event['player_id'],
            'room_id': event.get('room_id'),
        })

    def _sender_name(self) -> str:
        """Return the authenticated sender username or an anonymous fallback."""
        if self.profile:
            return self.profile.username
        return 'anonymous'
    

    def _is_room_participant(self) -> bool:
        """Return whether profile (user) belongs to the current direct room."""
        if self.room is None or self.profile is None:
            return False
        return self.room.participants.filter(id=self.profile.id).exists()

    @database_sync_to_async
    def _save_message(self, body: str,
                      action: str,
                      content: dict) -> tuple[bool, Message | dict]:
        """Persist a message for the profile (user) in the resolved room."""
        room = None
        if action == 'direct-message':
            if not self.user or not self.user.is_authenticated:
                return False, {'type': 'error',
                               'message': 'Authentication failed'}
            target_user = SiteUser.objects.filter(uid=content['user_uid']).first()
            if target_user is None:
                return False, {'type': 'error',
                               'message': 'User not found'}
            if not (Friendship.objects.filter(from_user__in=[target_user, self.user],
                                              to_user__in=[self.user, target_user],
                                              status='accepted'
                                              ).exists()):
                return False, {'type': 'error',
                               'message': 'Target is not a friend'}
            target_profile = target_user.profile
            id_a, id_b = self.profile.uid, target_profile.uid
            min_uid, max_uid = (id_a, id_b) if id_a < id_b else (id_b, id_a)
            room, created = Room.objects.get_or_create(
                name=f'user_{min_uid}_user_{max_uid}')
            if created:
                room.participants.add(self.profile)
                room.participants.add(target_profile)
        elif action == 'chat-message':
            if content.get('room_uid'):
                room = Room.objects.filter(uid=content['room_uid']).first()
                self.room = room
            elif self.room:
                room = self.room
            else:
                game = Game.objects.filter(
                    is_over=False,
                    players=self.profile).first().room
                if game and self.profile.game:
                    self.room = game.room
                    room = self.room
        if room is None or self.profile is None:
            return False, {'type': 'error',
                           'message': 'An unexpected error occured'}
        if not room.participants.filter(uid=self.profile.uid).exists():
            return False, {'type': 'error',
                           'message': 'Not a chat member'}
        message = Message.objects.create(
            sender_profile=self.profile,
            room=room,
            body=body,
        )
        return True, message

    @database_sync_to_async
    def _mark_delivered(self, message_id: str) -> bool:
        """Mark a room message as delivered if it exists."""
        message = Message.objects.filter(id=message_id).first()
        if not message:
            return False
        if not message.delivered:
            message.delivered = True
            message.save(update_fields=['delivered'])
        return True

    @database_sync_to_async
    def _mark_seen(self, message_uid: uuid.UUID) -> bool:
        """Mark a room message as seen and delivered if it exists."""
        message = Message.objects.filter(uid=message_uid, room=self.room).first()
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

class NotFoundConsumer(AsyncWebsocketConsumer):
    """Handle non-existant endpoint communication."""

    async def connect(self) -> None:
        """Reject connections to wrong endpoints."""
        await self.close(code=4040)
