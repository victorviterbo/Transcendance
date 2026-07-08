"""WebSocket consumer logic for public rooms, private direct messages and game ."""

import logging
import uuid

from channels.db import database_sync_to_async
from channels.generic.websocket import (
    AsyncJsonWebsocketConsumer,
    AsyncWebsocketConsumer,
)
from chat.chat_utils import accepted_friendship, create_direct_room
from chat.models import Message, Room
from chat.ws_game_chat import handle_game_chat_payload
from chat.ws_direct_message import (
    handle_friend_chat_payload,
    set_chat_open,
    update_online_status,
)
from game.models import Game
from game.ws_game_db_helpers import _get_game_history_data
from game.ws_game_logic import handle_game_action
from userauth.models import SiteUser
from userprofile.models import Profile
from userprofile.serializers import LightProfileSerializer

logger = logging.getLogger(__name__)

class GlobalConsumer(AsyncJsonWebsocketConsumer):
    """Handle chat WebSocket connections, message broadcasts, and status updates."""

    create_missing_profile = True
    
    def __init__(self, *args: tuple, **kwargs: dict) -> None:
        """Define initialisation of consumer class."""
        super().__init__(*args, **kwargs)
        
        self.room = None
        self.profile = None
        self.profile_data = None
        self.active_layers = set()
        self.group_name = None
        self.game = None
        self.current_game = None
        self.game_group_name = None
        self.open_chat_recipient = set() 
    
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
        self.profile, self.profile_data = await self._get_profile_from_scope()
        if not self.profile:
            logger.warning('ws.connect.rejected could not retrieve profile')
            await self.close(code=4401)
            return
        self.group_name = f"user_{self.profile.uid}"
        await self.add_to_layer(self.group_name)
        await update_online_status(self, self.profile.id, is_online=True)
        logger.info('ws.presence.online profile_id=%s username=%s group=%s',
                    self.profile.id,
                    self.profile.username,
                    self.group_name)
        await self.accept()
        logger.info('ws.connect.accepted profile_id=%s username=%s guest=%s user_id=%s group=%s',
                    self.profile.id,
                    self.profile.username,
                    self.profile.guest,
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
        for recipient_profile_id in list(getattr(self, 'open_direct_chat_recipient_ids', set())):
            if getattr(self, 'profile', None):
                await set_chat_open(self.profile.id, recipient_profile_id, is_open=False)
        if getattr(self, "profile", None):
            await update_online_status(self, self.profile.id, is_online=False)
            logger.info('ws.presence.offline profile_id=%s username=%s group=%s',
                        self.profile.id,
                        self.profile.username,
                        self.group_name)
        return
    
    async def receive_json(self, content: dict) -> None:
        """Receive websocket payloads and route them by target/event."""
        logger.debug(
            'ws.receive profile_id=%s keys=%s target=%s event=%s',
            getattr(getattr(self, 'profile', None), 'id', None),
            list(content.keys()),
            content.get('target'),
            content.get('event'),
        )
        target = content.get('target')
        event = content.get('event')

        if target == 'friend_chat':
            await handle_friend_chat_payload(self, content, event)
            return
        if target == 'game':
            if event == 'message_send':
                await handle_game_chat_payload(self, content)
                return
            await handle_game_action(self, content)
            return
        logger.warning(
            'ws.receive.unsupported_target profile_id=%s target=%s',
            getattr(getattr(self, 'profile', None), 'id', None),
            target,
        )
        await self.close(code=4405)


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
    def get_profile_by_uid(self, profile_uid: str) -> Profile | None:
        return Profile.objects.filter(uid=profile_uid).first()

    async def game_chat_message(self, event: dict) -> None:
        """Forward a chat message event to the connected client.
        So its final output formattes for each connected socket"""
        await self.send_json({
            'target': 'game',
            'event': 'message_broadcast',
            'uid': event.get('uid'),
            'self': LightProfileSerializer(self.profile).data,
            'message': event.get('message'),
        })

    async def send_notification(self, event: dict) -> None:
        """Forward social notifications to the connected client."""
        payload = event.get('payload')
        if isinstance(payload, dict):
            await self.send_json(payload)
            return

        await self.send_json({
            'target': event.get('target', 'social-notif'),
            'type': 'social_notification',
            'event': event.get('message'),
            'from_user': event.get('from_user'),
            'from_user_uid': event.get('from_user_uid'),
            'to_user_uid': event.get('to_user_uid'),
            'friendship_uid': event.get('friendship_uid'),
        })

    # Game event handlers

    async def global_error_mssg(self, event: dict) -> None:
        """Notify all players of an error."""
        await self.send_json({
            'target': 'game',
            'event': 'player_joined',
            'game': event.get('game'),
            'self': self.profile_data,
            'error_mssg': event.get('error_mssg')
        })
    
    async def game_player_joined(self, event: dict) -> None:
        """Notify of a player joining the game room."""
        await self.send_json({
            'target': 'game',
            'event': 'player_joined',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'player': event.get('player')
        })

    async def game_settings_updated(self, event: dict) -> None:
        """Notify clients that game settings have changed."""
        await self.send_json({
            'target': 'game',
            'event': 'settings_updated',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'settings': event.get('settings', {}),
        })

    async def game_answer_validation(self, event: dict) -> None:
        """Notify of an answer validation with title/artist found status."""
        payload = {
            'target': 'game',
            'event': 'answer_validation',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'titleFound': event.get('titleFound', False),
            'artistFound': event.get('artistFound', False),
            'time': event.get('time'),
        }
        if event.get('titleFound') and event.get('artistFound'):
            payload['track'] = event.get('track', {})
        await self.send_json(payload)

    #TODO: Legacy methods for answer validation, to be removed
    async def game_answer_correct(self, event: dict) -> None:
        """Notify of an answer submission."""
        await self.send_json({
            'target': 'game',
            'event': 'answer_validation',
            'uid': event.get('uid'),
            'senderPlayer': event.get('sender_player'),
            'self': self.profile_data,
            'answer': event.get('answer'),
            'trackArtist': event.get('trackArtist'),
            'trackTitle': event.get('trackTitle'),
            'correct': event.get('is_correct', False),
            'time': event.get('time'),
        })

    async def game_answer_incorrect(self, event: dict) -> None:
        """Notify of an answer submission."""
        await self.send_json({
            'target': 'game',
            'event': 'answer_validation',
            'uid': event.get('uid'),
            'senderPlayer': event.get('senderPlayer'),
            'self': self.profile_data,
            'answer': event.get('answer'),
            'correct': event.get('is_correct', False),
        })

    async def game_player_left(self, event: dict) -> None:
        """Notify of a player leaving the game room."""
        await self.send_json({
            'target': 'game',
            'event': 'player_left',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'player': event.get('player'),
        })

    async def game_round_start(self, event: dict) -> None:
        """Broadcast round start with blind track info to all players."""
        await self.send_json({
            'target': 'game',
            'event': 'round_started',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'preview': event.get('preview'),
            'playbackDuration': event.get('playbackDuration'),
            'round': event.get('round'),
        })

    async def game_round_preview(self, event: dict) -> None:
        """Broadcast the preview track before the round starts."""
        await self.send_json({
            'target': 'game',
            'event': 'round_preview',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'preview': event.get('preview'),
            'playbackDuration': event.get('playbackDuration'),
            'round': event.get('round'),
        })

    async def game_round_end(self, event: dict) -> None:
        """Send round results and next round timing."""
        await self.send_json({
            'target': 'game',
            'event': 'round_ended',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'track': event.get('track'),
            'leaderboard': event.get('leaderboard', []),
            'results': event.get('results', []),
            'is_last_round': event.get('is_last_round', False),
        })
    
    async def game_start_signal(self, event: dict) -> None:
        """Broadcast final game results and leaderboard."""
        await self.send_json({
            'target': 'game',
            'event': 'game_started',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'settings': event.get('settings'),
            'delay': event.get('delay'),
        })

    async def game_completed(self, event: dict) -> None:
        """Broadcast final game results and leaderboard."""
        await self.send_json({
            'target': 'game',
            'event': 'game_completed',
            'game': event.get('game'),
            'self': self.profile_data,
            'leaderboard': event.get('leaderboard'),
        })

    async def game_answer_broadcast(self, event: dict) -> None:
        """Broadcast incorrect answer to all players."""
        payload = {
            'target': 'game',
            'event': 'answer_broadcast',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'player': event.get('player'),
            'kind': event.get('kind'),
        }
        if 'answer' in event:
            payload['answer'] = event.get('answer')
        await self.send_json(payload)

    async def game_ended_event(self, event: dict) -> None:
        """Broadcast game end with final leaderboard and history."""
        history = await _get_game_history_data(event.get('uid'), self.profile)
        await self.send_json({
            'target': 'game',
            'event': 'game_ended',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'leaderboard': event.get('leaderboard'),
            'history': history,
        })

    async def game_restarted_event(self, event: dict) -> None:
        """Broadcast a game restart and the UID of the new session."""
        await self.send_json({
            'target': 'game',
            'event': 'game_restarted',
            'uid': event.get('uid'),
            'self': self.profile_data,
            'newGame': event.get('newGame'),
        })

    async def game_closed_event(self, event: dict) -> None:
        """Broadcast a game closed event to all players."""
        await self.send_json({
            'target': 'game',
            'event': 'game_closed',
            'uid': event.get('uid'),
            'self': self.profile_data,
        })

    def _sender_name(self) -> str:
        """Return the authenticated sender username or an anonymous fallback."""
        if self.profile:
            return self.profile.username
        return 'anonymous'
    
    @database_sync_to_async
    def _get_profile_from_scope(self) -> tuple[Profile, dict | None, None]:
        """Resolve profile from user, injected profile, or guest session."""
        self.user = self.scope.get("user")
        if self.user and isinstance(self.user, SiteUser) and self.user.is_authenticated:
            try:
                profile = self.user.profile
                logger.debug('ws.profile_resolve.from_authenticated_user user_id=%s profile_id=%s username=%s',
                             self.user.id, profile.id, profile.username)
                return profile, LightProfileSerializer(profile).data
            except Profile.DoesNotExist:
                logger.warning('ws.profile_resolve.authenticated_user_no_profile user_id=%s',
                               self.user.id)
                return None, None
        profile = self.scope.get("profile")
        if isinstance(profile, Profile):
            logger.debug('ws.profile_resolve.from_scope_injection profile_id=%s guest=%s',
                         profile.id, profile.guest)
            return profile, LightProfileSerializer(profile).data

        session = self.scope.get("session", {})
        guest_uid = session.get("guest_profile_uid")
        if guest_uid:
            guest_profile = Profile.objects.filter(uid=guest_uid).first()
            logger.debug('ws.profile_resolve.from_session_profile_uid profile_id=%s uid=%s guest=%s',
                         guest_profile.id if guest_profile else None,
                         guest_uid,
                         guest_profile.guest if guest_profile else None)
            if (guest_profile and self.user and isinstance(self.user, SiteUser)
            and self.user.is_authenticated and guest_profile.user_id is None):
                guest_profile.user = self.user
                guest_profile.guest = False
                guest_profile.save(update_fields=['user', 'guest'])
                logger.info('ws.profile_resolve.session_profile_linked user_id=%s profile_id=%s',
                            self.user.id,
                            guest_profile.id)
            return guest_profile, LightProfileSerializer(guest_profile).data
        if self.create_missing_profile:
            guest_username = f"Guest_{uuid.uuid4().hex[:6]}"
            new_profile = Profile.objects.create(username=guest_username, guest=True)
            logger.debug('ws.profile_resolve.created_new_guest profile_id=%s', new_profile.id)
            return new_profile, LightProfileSerializer(new_profile).data
        logger.warning('ws.profile_resolve.failed no_profile_found')
        return None, None

    @database_sync_to_async
    def _save_message(self, body: str,
                      event: str,
                      content: dict) -> tuple[bool, Message | dict]:
        """Persist a message for the profile (user) in the resolved room."""
        room = None
        if event == 'direct-message':
            sender_user = None
            logger.debug('ws.direct_message.auth_check profile_id=%s self.user=%s is_auth=%s profile_guest=%s profile_user_id=%s',
                         getattr(self.profile, 'id', None),
                         type(getattr(self, 'user', None)).__name__,
                         bool(self.user and self.user.is_authenticated) if self.user else False,
                         getattr(self.profile, 'guest', None),
                         getattr(self.profile, 'user_id', None))
            if self.user and self.user.is_authenticated:
                sender_user = self.user
                logger.debug('ws.direct_message.sender_resolved_from_user profile_id=%s user_id=%s',
                             getattr(self.profile, 'id', None),
                             self.user.id)
            elif self.profile and not self.profile.guest and self.profile.user_id:
                sender_user = self.profile.user
                logger.debug('ws.direct_message.sender_resolved_from_profile profile_id=%s user_id=%s',
                             getattr(self.profile, 'id', None),
                             self.profile.user_id)

            if sender_user is None:
                logger.warning('ws.direct_message.auth_failed profile_id=%s guest=%s user_in_scope=%s profile_user_id=%s',
                               getattr(self.profile, 'id', None),
                               getattr(self.profile, 'guest', None),
                               bool(getattr(self, 'user', None) and self.user.is_authenticated),
                               getattr(self.profile, 'user_id', None))
                return False, {'target': 'error',
                               'message': 'USER_NOT_FOUND'}
            recipient_uid = content.get('user_uid')
            recipient_user = SiteUser.objects.filter(uid=recipient_uid).first()
            if recipient_user is None and recipient_uid is not None:
                recipient_profile = Profile.objects.filter(uid=recipient_uid).select_related('user').first()
                if recipient_profile is not None:
                    recipient_user = recipient_profile.user
            if recipient_user is None:
                return False, {'target': 'error',
                               'message': 'USER_NOT_FOUND'}
            if not accepted_friendship(self.profile, recipient_user.profile):
                return False, {'target': 'error',
                               'message': 'USER_NOT_FRIEND'}
            recipient_profile = recipient_user.profile
            room, _ = create_direct_room(self.profile, recipient_profile)
            if room is None:
                return False, {'target': 'error',
                    'message': 'ROOM_NOT_FOUND'}
            
        elif event == 'chat-message':
            if getattr(self, 'current_game', None) and getattr(self.current_game, 'room', None):
                room = self.current_game.room
                self.room = room
            elif content.get('room_uid'):
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
            return False, {'target': 'error',
                           'message': 'ROOM_NOT_FOUND'}
        if not room.participants.filter(uid=self.profile.uid).exists():
            is_game_room = (
                not room.is_direct
                and getattr(self, 'current_game', None) is not None
                and getattr(self.current_game, 'room_id', None) == room.id
            )
            if not is_game_room:
                return False, {'target': 'error',
                           'message': 'INVALID_ROOM'}
        message = Message.objects.create(
            sender=self.profile,
            room=room,
            body=body,
        )
        return True, message

class NotFoundConsumer(AsyncWebsocketConsumer):
    """Handle non-existant endpoint communication."""

    async def connect(self) -> None:
        """Reject connections to wrong endpoints."""
        await self.close(code=4040)
