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
from chat.serializers import FriendChatMessageSerializer
from chat.ws_direct_message import (
	get_recipient_profile,
	handle_chat_payload,
	is_chat_open,
	mark_message_delivered,
	mark_message_seen,
	set_chat_open,
	update_online_status,
)
from game.models import Game
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
		self.active_layers = set()
		self.group_name = None
		self.game = None
		self.game_group_name = None
		self.open_chat_recipient = set() # tracker when frontend sends open/close so can mark as seen
	
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

		if target == 'friend-chat':
			await handle_chat_payload(self, content, event)
			return
		if target == 'chat':
			await self.chat_subroutine(content)
			return
		if target == 'game':
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
	
	async def chat_subroutine(self, content: dict, **kwargs: dict) -> None:
		"""Process incoming chat events from the client."""
		event = content.get('event')
		cycle_event = event

		if event == 'chat-message':
			body = str(content.get('message', '')).strip()
			if not body:
				await self.send_json({'type': 'error','message': 'message is required'})
				return
			success, message = await self._save_message(body, event, content)
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

			await self.group_send(f'user_{self.profile.uid}', {
				'type': 'chat.message',
				'message_uid': str(message.uid),
				'message': message.body,
				'sender': self._sender_name(),
				'created': message.created.isoformat(),
				'delivered': message.delivered,
				'seen': message.seen,
			})
			return
		elif event == 'direct-message':
			body = str(content.get('message', '')).strip()
			if not body:
				await self.send_json({'type': 'error','message': 'message is required'})
				return
			success, message = await self._save_message(body, event, content)
			if not success:
				expected_validation_errors = {'Target is not a friend', 'User not found'}
				message_text = message.get('message') if isinstance(message, dict) else None
				log_fn = logger.info if message_text in expected_validation_errors else logger.warning
				log_fn('ws.direct_message.save_failed profile_id=%s error=%s',
					   getattr(getattr(self, 'profile', None), 'id', None),
					   message)
				await self.send_json(message)
				return

			recipient_profile = await get_recipient_profile(message)
			if recipient_profile is None:
				logger.warning('ws.direct_message.no_recipient profile_id=%s message_uid=%s',
							   getattr(getattr(self, 'profile', None), 'id', None),
							   message.uid)
				await self.send_json({'type': 'error','message': 'Target user not found'})
				return

			if recipient_profile.is_online:
				recipient_chat_open = await is_chat_open(recipient_profile.id, self.profile.id)
				if recipient_chat_open:
					await mark_message_seen(message.uid)
					message.delivered = True
					message.seen = True
				elif not message.delivered:
					await mark_message_delivered(message.uid)
					message.delivered = True

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
			await self.group_send(f'user_{recipient_profile.uid}', event_payload)
			await self.group_send(f'user_{self.profile.uid}', event_payload)

			sender_payload = {
				'target': 'friend-chat',
				'event': 'new',
				'message': FriendChatMessageSerializer(
					message,
					context={'recipient_profile': recipient_profile, 'direction': 'outgoing'},
				).data,
			}
			recipient_payload = {
				'target': 'friend-chat',
				'event': 'new',
				'message': FriendChatMessageSerializer(
					message,
					context={'recipient_profile': self.profile, 'direction': 'incoming'},
				).data,
			}
			await self.group_send(f'user_{self.profile.uid}', {
				'type': 'send.notification',
				'payload': sender_payload,
			})
			if recipient_profile.is_online:
				await self.group_send(f'user_{recipient_profile.uid}', {
					'type': 'send.notification',
					'payload': recipient_payload,
				})
			return
		elif cycle_event in ('open', 'close'):
			recipient_uid = content.get('target_uid')
			if not recipient_uid:
				await self.send_json({'type': 'error', 'message': 'target_uid is required'})
				return
			recipient_profile = await self.get_profile_by_uid(recipient_uid)
			if not recipient_profile:
				await self.send_json({'type': 'error', 'message': 'target_not_found'})
				return

			is_open = cycle_event == 'open'
			await set_chat_open(self.profile.id, recipient_profile.id, is_open=is_open)
			if is_open:
				self.open_chat_recipient.add(recipient_profile.id)
			else:
				self.open_chat_recipient.discard(recipient_profile.id)
			return
		await self.send_json({'type': 'error', 'message': 'unsupported_event'})

	@database_sync_to_async
	def get_profile_by_uid(self, profile_uid: str) -> Profile | None:
		return Profile.objects.filter(uid=profile_uid).first()

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
	async def game_player_joined(self, event: dict) -> None:
		"""Notify of a player joining the game room."""
		await self.send_json({
			'target': 'game',
			'event': 'player_joined',
			'game': event.get('game'),
			'self': LightProfileSerializer(self.profile).data,
			'player': event.get('player')
		})

	async def game_settings_updated(self, event: dict) -> None:
		"""Notify clients that game settings have changed."""
		await self.send_json({
			'target': 'game',
			'event': 'settings_updated',
			'game': event.get('game'),
			'self': LightProfileSerializer(self.profile).data,
			'settings': event.get('settings', {}),
		})

	async def game_answer_correct(self, event: dict) -> None:
		"""Notify of an answer submission."""
		await self.send_json({
			'target': 'game',
			'event': 'answer_validation',
			'game': event.get('game'),
			'senderPlayer': event.get('sender_player'),
			'self': LightProfileSerializer(self.profile).data,
			'answer': event.get('answer'),
			'trackArtist': event.get('trackArtist'),
			'tracktitle': event.get('tracktitle'),
			'correct': event.get('is_correct', False),
		})

	async def game_answer_incorrect(self, event: dict) -> None:
		"""Notify of an answer submission."""
		await self.send_json({
			'target': 'game',
			'event': 'answer_validation',
			'game': event.get('game'),
			'senderPlayer': event.get('senderPlayer'),
			'self': LightProfileSerializer(self.profile).data,
			'answer': event.get('answer'),
			'correct': event.get('is_correct', False),
		})

	async def game_player_left(self, event: dict) -> None:
		"""Notify of a player leaving the game room."""
		await self.send_json({
			'target': 'game',
			'event': 'player_left',
			'game': event.get('game'),
			'self': LightProfileSerializer(self.profile).data,
			'player': event.get('player'),
		})

	async def game_round_start(self, event: dict) -> None:
		"""Broadcast round start with blind track info to all players."""
		await self.send_json({
			'target': 'game',
			'event': 'round_started',
			'game': event.get('game'),
			'self': LightProfileSerializer(self.profile).data,
			'track': event.get('track'),
			'playbackDuration': event.get('playbackDuration'),
		})

	async def game_round_end(self, event: dict) -> None:
		"""Send round results and next round timing."""
		await self.send_json({
			'target': 'game',
			'event': 'round_end',
			'game': event.get('game'),
			'self': LightProfileSerializer(self.profile).data,
			'track': event.get('track'),
			'results': event.get('results'),
			'is_last_round': event.get('is_last_round', False),
		})
	
	async def game_start_signal(self, event: dict) -> None:
		"""Broadcast final game results and leaderboard."""
		await self.send_json({
			'target': 'game',
			'event': 'start_signal',
			'game': event.get('game'),
			'self': LightProfileSerializer(self.profile).data,
		})

	async def game_completed(self, event: dict) -> None:
		"""Broadcast final game results and leaderboard."""
		await self.send_json({
			'target': 'game',
			'event': 'game_completed',
			'game': event.get('game'),
			'self': LightProfileSerializer(self.profile).data,
			'leaderboard': event.get('leaderboard'),
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

		profile = self.scope.get("profile")
		if isinstance(profile, Profile):
			logger.debug('ws.profile_resolve.from_scope_injection profile_id=%s guest=%s',
						 profile.id, profile.guest)
			return profile

		session = self.scope.get("session", {})
		guest_uid = session.get("guest_profile_uid")
		if guest_uid:
			guest_profile = Profile.objects.filter(uid=guest_uid).first()
			logger.debug('ws.profile_resolve.from_session_profile_uid profile_id=%s uid=%s guest=%s',
						 guest_profile.id if guest_profile else None,
						 guest_uid,
						 guest_profile.guest if guest_profile else None)
			if guest_profile and self.user and isinstance(self.user, SiteUser) and self.user.is_authenticated and guest_profile.user_id is None:
				guest_profile.user = self.user
				guest_profile.guest = False
				guest_profile.save(update_fields=['user', 'guest'])
				logger.info('ws.profile_resolve.session_profile_linked user_id=%s profile_id=%s',
							self.user.id,
							guest_profile.id)
			return guest_profile

		if self.create_missing_profile:
			guest_username = f"Guest_{uuid.uuid4().hex[:6]}"
			new_profile = Profile.objects.create(username=guest_username, guest=True)
			logger.debug('ws.profile_resolve.created_new_guest profile_id=%s', new_profile.id)
			return new_profile
		
		logger.warning('ws.profile_resolve.failed no_profile_found')
		return None

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
				return False, {'type': 'error',
							   'message': 'Authentication failed'}
			recipient_uid = content.get('user_uid')
			recipient_user = SiteUser.objects.filter(uid=recipient_uid).first()
			if recipient_user is None and recipient_uid is not None:
				recipient_profile = Profile.objects.filter(uid=recipient_uid).select_related('user').first()
				if recipient_profile is not None:
					recipient_user = recipient_profile.user
			if recipient_user is None:
				return False, {'type': 'error',
							   'message': 'User not found'}
			if not accepted_friendship(self.profile, recipient_user.profile):
				return False, {'type': 'error',
							   'message': 'Target is not a friend'}
			recipient_profile = recipient_user.profile
			room, created = create_direct_room(self.profile, recipient_profile)
			if created:
				room.participants.add(self.profile)
				room.participants.add(recipient_profile)
		elif event == 'chat-message':
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

class NotFoundConsumer(AsyncWebsocketConsumer):
	"""Handle non-existant endpoint communication."""

	async def connect(self) -> None:
		"""Reject connections to wrong endpoints."""
		await self.close(code=4040)
