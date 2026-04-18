"""WebSocket consumer logic for public rooms and private direct messages."""

import logging
import uuid

from channels.db import database_sync_to_async
from channels.generic.websocket import (
    AsyncJsonWebsocketConsumer,
    AsyncWebsocketConsumer,
)
from chat.models import Message, Room
from game.models import Game
from userauth.models import SiteUser
from userprofile.models import Profile

from chat.chat_utils import accepted_friendship_exists, get_or_create_direct_room


logger = logging.getLogger(__name__)


class GlobalConsumer(AsyncJsonWebsocketConsumer):
    """Handle chat WebSocket connections, message broadcasts, and status updates."""

    create_profile_if_missing = True
    
    def __init__(self, *args: tuple, **kwargs: dict) -> None:
        """Define initialisation of consumer class."""
        super().__init__(*args, **kwargs)
        
        self.room = None
        self.profile = None
        self.active_layers = set()
        self.room_name = "default_room"
        self.group_name = None
        self.chat_group_name = f"chat_{self.room_name}"
    
    async def connect(self) -> None:
        """Define process upon client connection to websocket."""
        logger.info('ws.connect.start channel_name=%s', self.channel_name)
        logger.debug('ws.connect.scope user=%s profile_in_scope=%s session_keys=%s', 
                     type(getattr(self, 'user', None)).__name__ if hasattr(self, 'user') else 'NOT_SET',
                     'profile' in self.scope,
                     list(self.scope.get('session', {}).keys()) if self.scope.get('session') else 'NO_SESSION')
        
        logger.debug('ws.connect.attempt user=%s scope_keys=%s', 
                     type(getattr(self, 'user', None)).__name__,
                     list(self.scope.keys()))
        self.profile = await self._get_profile_from_scope()
        if not self.profile:
            logger.warning('ws.connect.rejected unauthenticated')
            await self.close(code=4401)
            return
        self.group_name = f"user_{self.profile.id}"
        await self.add_to_layer(self.group_name)
        await self._update_online_status(is_online=True)
        await self.accept()
        logger.info('ws.connect.accepted profile_id=%s username=%s is_guest=%s user_id=%s group=%s',
                    self.profile.id,
                    self.profile.username,
                    self.profile.is_guest,
                    self.profile.user_id,
                    self.group_name)
        return

    async def disconnect(self, close_code: int) -> None:
        """Remove the socket from its channel-layer group when disconnecting."""
        logger.info('ws.disconnect profile_id=%s close_code=%s active_layers=%s',
                    getattr(getattr(self, 'profile', None), 'id', None),
                    close_code,
                    len(getattr(self, 'active_layers', set())))
        for layer in getattr(self, "active_layers", set()):
            await self.channel_layer.group_discard(layer, self.channel_name)
        if getattr(self, "profile", None):
            await self._update_online_status(False)
        return
    
    async def receive_json(self, content: dict) -> None:
        """Receive websocket framework and reroute it to the appropriate module."""
        logger.debug('ws.receive profile_id=%s keys=%s module=%s target=%s event=%s action=%s',
                     getattr(getattr(self, 'profile', None), 'id', None),
                     list(content.keys()),
                     content.get('module'),
                     content.get('target'),
                     content.get('event'),
                     content.get('action'))
        if content.get('target') == 'friend-chat' and content.get('event') == 'send':
            frontend_message = content.get('message')
            if not isinstance(frontend_message, dict):
                logger.warning('ws.receive.invalid_friend_chat_payload profile_id=%s',
                               getattr(getattr(self, 'profile', None), 'id', None))
                await self.send_json({'type': 'error',
                                      'message': 'message is required'})
                return
            logger.info('ws.receive.friend_chat_translate profile_id=%s target_id=%s message_len=%s',
                        getattr(getattr(self, 'profile', None), 'id', None),
                        frontend_message.get('target-id'),
                        len(str(frontend_message.get('message', ''))))
            await self.chat_subroutine({
                'action': 'direct-message',
                'message': frontend_message.get('message'),
                'user_uid': frontend_message.get('target-id'),
                '_frontend_contract': True,
            })
            return

        module = content.get("module")
        if module == "chat":
            await self.chat_subroutine(content)
        elif module == "game":
            await self.game_subroutine(content)
        else:
            logger.warning('ws.receive.unsupported_module profile_id=%s module=%s',
                           getattr(getattr(self, 'profile', None), 'id', None),
                           module)
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
        logger.debug('ws.group_send group=%s type=%s keys=%s',
                     group_name,
                     message.get('type'),
                     list(message.keys()))
        await self.channel_layer.group_send(group_name, message)
    
    async def chat_subroutine(self, content: dict, **kwargs: dict) -> None:
        """Process incoming message, delivered, and read actions from the client."""
        action = content.get('action')
        logger.debug('ws.chat_subroutine profile_id=%s action=%s',
                     getattr(getattr(self, 'profile', None), 'id', None),
                     action)

        if action == 'chat-message':
            body = str(content.get('message', '')).strip()
            if not body:
                await self.send_json({'type': 'error',
                                      'message': 'message is required'})
                return
            success, message = await self._save_message(body, action, content)
            if not success:
                logger.warning('ws.chat_message.save_failed profile_id=%s error=%s',
                               getattr(getattr(self, 'profile', None), 'id', None),
                               message)
                await self.send_json(message)
                return

            logger.info('ws.chat_message.saved profile_id=%s message_uid=%s room_uid=%s',
                        getattr(getattr(self, 'profile', None), 'id', None),
                        message.uid,
                        message.room.uid)

            await self.group_send(f'user_{self.profile.id}', {
                'type': 'chat.message',
                'message_uid': str(message.uid),
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
                logger.warning('ws.direct_message.save_failed profile_id=%s error=%s',
                               getattr(getattr(self, 'profile', None), 'id', None),
                               message)
                await self.send_json(message)
                return

            recipient_profile = await self._get_direct_recipient_profile(message)
            if recipient_profile is None:
                logger.warning('ws.direct_message.no_recipient profile_id=%s message_uid=%s',
                               getattr(getattr(self, 'profile', None), 'id', None),
                               message.uid)
                await self.send_json({'type': 'error',
                                      'message': 'Target user not found'})
                return

            logger.info('ws.direct_message.sent sender_profile_id=%s recipient_profile_id=%s message_uid=%s',
                        getattr(getattr(self, 'profile', None), 'id', None),
                        recipient_profile.id,
                        message.uid)

            event_payload = {
                'type': 'chat.message',
                'message_uid': str(message.uid),
                'message': message.body,
                'sender': self._sender_name(),
                'created': message.created.isoformat(),
                'delivered': message.delivered,
                'seen': message.seen,
            }
            await self.group_send(f'user_{recipient_profile.id}', event_payload)
            await self.group_send(f'user_{self.profile.id}', event_payload)

            sender_payload = {
                'target': 'friend-chat',
                'event': 'new',
                'message': {
                    'message': message.body,
                    'date': message.created.isoformat(),
                    'direction': 'outgoing',
                    'status': 'read' if message.seen else ('recieved' if message.delivered else 'sent'),
                    'target-id': str(recipient_profile.uid),
                    'target': recipient_profile.username,
                    'uid': str(message.uid),
                },
            }
            recipient_payload = {
                'target': 'friend-chat',
                'event': 'new',
                'message': {
                    'message': message.body,
                    'date': message.created.isoformat(),
                    'direction': 'incoming',
                    'target-id': str(self.profile.uid),
                    'target': self.profile.username,
                    'uid': str(message.uid),
                },
            }
            await self.group_send(f'user_{self.profile.id}', {
                'type': 'send.notification',
                'payload': sender_payload,
            })
            await self.group_send(f'user_{recipient_profile.id}', {
                'type': 'send.notification',
                'payload': recipient_payload,
            })
            return
        elif action in ('delivered', 'read'):
            message_id = content.get('message_id')
            if not message_id:
                logger.warning('ws.status_update.missing_message_id profile_id=%s action=%s',
                               getattr(getattr(self, 'profile', None), 'id', None),
                               action)
                await self.send_json({'type': 'error',
                                      'message': 'message_id is required'})
                return

            if action == 'delivered':
                changed = await self._mark_delivered(message_id)
            else:
                changed = await self._mark_seen(message_id)

            if not changed:
                logger.warning('ws.status_update.not_found profile_id=%s action=%s message_id=%s',
                               getattr(getattr(self, 'profile', None), 'id', None),
                               action,
                               message_id)
                await self.send_json({'type': 'error', 'message': 'message_not_found'})
                return

            logger.info('ws.status_update.applied profile_id=%s action=%s message_id=%s',
                        getattr(getattr(self, 'profile', None), 'id', None),
                        action,
                        message_id)

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

    async def send_notification(self, event: dict) -> None:
        """Forward social notifications to the connected client."""
        payload = event.get('payload')
        logger.debug('ws.send_notification profile_id=%s has_payload=%s target=%s',
                     getattr(getattr(self, 'profile', None), 'id', None),
                     isinstance(payload, dict),
                     event.get('target'))
        if isinstance(payload, dict):
            await self.send_json(payload)
            return

        await self.send_json({
            'target': event.get('target', 'social-notif'),
            'type': 'social_notification',
            'module': event.get('module', 'social'),
            'event': event.get('message'),
            'from_user': event.get('from_user'),
            'from_user_uid': event.get('from_user_uid'),
            'to_user_uid': event.get('to_user_uid'),
            'friendship_uid': event.get('friendship_uid'),
        })

    def _sender_name(self) -> str:
        """Return the authenticated sender username or an anonymous fallback."""
        if self.profile:
            return self.profile.username
        return 'anonymous'

    @database_sync_to_async
    def _get_profile_from_scope(self) -> Profile | None:
        """Resolve profile from user, injected profile, or guest session."""
        self.user = self.scope.get("user")
        if self.user and isinstance(self.user, SiteUser) and self.user.is_authenticated:
            try:
                profile = self.user.profile
                logger.debug('ws.profile_resolve.from_authenticated_user user_id=%s profile_id=%s username=%s',
                             self.user.id, profile.id, profile.username)
                return profile
            except Profile.DoesNotExist:
                logger.warning('ws.profile_resolve.authenticated_user_no_profile user_id=%s',
                               self.user.id)
                return None

        profile = self.scope.get("profile")
        if isinstance(profile, Profile):
            logger.debug('ws.profile_resolve.from_scope_injection profile_id=%s is_guest=%s',
                         profile.id, profile.is_guest)
            return profile

        session = self.scope.get("session", {})
        guest_uid = session.get("guest_profile_uid")
        if guest_uid:
            guest_profile = Profile.objects.filter(uid=guest_uid, is_guest=True).first()
            logger.debug('ws.profile_resolve.from_session_guest_uid profile_id=%s uid=%s',
                         guest_profile.id if guest_profile else None, guest_uid)
            return guest_profile

        guest_id = session.get("guest_profile_id")
        if guest_id:
            guest_profile = Profile.objects.filter(id=guest_id, is_guest=True).first()
            logger.debug('ws.profile_resolve.from_session_guest_id profile_id=%s id=%s',
                         guest_profile.id if guest_profile else None, guest_id)
            return guest_profile

        if self.create_profile_if_missing:
            new_profile = Profile.objects.create()
            logger.debug('ws.profile_resolve.created_new_guest profile_id=%s', new_profile.id)
            return new_profile
        
        logger.warning('ws.profile_resolve.failed no_profile_found')
        return None

        return None

    @database_sync_to_async
    def _save_message(self, body: str,
                      action: str,
                      content: dict) -> tuple[bool, Message | dict]:
        """Persist a message for the profile (user) in the resolved room."""
        room = None
        if action == 'direct-message':
            sender_user = None
            logger.debug('ws.direct_message.auth_check profile_id=%s self.user=%s is_auth=%s profile_is_guest=%s profile_user_id=%s',
                         getattr(self.profile, 'id', None),
                         type(getattr(self, 'user', None)).__name__,
                         bool(self.user and self.user.is_authenticated) if self.user else False,
                         getattr(self.profile, 'is_guest', None),
                         getattr(self.profile, 'user_id', None))
            if self.user and self.user.is_authenticated:
                sender_user = self.user
                logger.debug('ws.direct_message.sender_resolved_from_user profile_id=%s user_id=%s',
                             getattr(self.profile, 'id', None),
                             self.user.id)
            elif self.profile and not self.profile.is_guest and self.profile.user_id:
                sender_user = self.profile.user
                logger.debug('ws.direct_message.sender_resolved_from_profile profile_id=%s user_id=%s',
                             getattr(self.profile, 'id', None),
                             self.profile.user_id)

            if sender_user is None:
                logger.warning('ws.direct_message.auth_failed profile_id=%s is_guest=%s user_in_scope=%s profile_user_id=%s',
                               getattr(self.profile, 'id', None),
                               getattr(self.profile, 'is_guest', None),
                               bool(getattr(self, 'user', None) and self.user.is_authenticated),
                               getattr(self.profile, 'user_id', None))
                return False, {'type': 'error',
                               'message': 'Authentication failed'}
            target_uid = content.get('user_uid')
            target_user = SiteUser.objects.filter(uid=target_uid).first()
            if target_user is None and target_uid is not None:
                target_profile = Profile.objects.filter(uid=target_uid).select_related('user').first()
                if target_profile is not None:
                    target_user = target_profile.user
            if target_user is None:
                return False, {'type': 'error',
                               'message': 'User not found'}
            if not accepted_friendship_exists(self.profile, target_user.profile):
                return False, {'type': 'error',
                               'message': 'Target is not a friend'}
            target_profile = target_user.profile
            room, created = get_or_create_direct_room(self.profile, target_profile)
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

    @database_sync_to_async
    def _get_direct_recipient_profile(self, message: Message) -> Profile | None:
        """Return the other participant profile for a direct-message room."""
        return message.room.participants.exclude(id=self.profile.id).first()

class NotFoundConsumer(AsyncWebsocketConsumer):
    """Handle non-existant endpoint communication."""

    async def connect(self) -> None:
        """Reject connections to wrong endpoints."""
        await self.close(code=4040)
