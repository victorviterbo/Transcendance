"""Helpers for sending game-linked chat history over websocket."""
from typing import TYPE_CHECKING
from channels.db import database_sync_to_async
import logging

from .models import Message, Room
from .serializers import RoomHistorySerializer
from userprofile.serializers import LightProfileSerializer

if TYPE_CHECKING:
    from project.consumers import GlobalConsumer

logger = logging.getLogger(__name__)


def create_gamechat_room(game) -> Room:
	"""Create the chat room linked to a newly created game."""
	return Room.objects.create(
		name=f'Chat Room - {game.uid}',
		is_direct=False,
	)

@database_sync_to_async
def add_gameroom_participant(game, profile) -> None:
	"""Ensure a game player can post in the linked chat room."""
	if not getattr(game, 'room', None):
		return
	if not game.room.participants.filter(uid=profile.uid).exists():
		game.room.participants.add(profile)



@database_sync_to_async
def get_join_history(game) -> list[dict]:
	"""Return serialized chat history for the game-linked room."""
	if not getattr(game, 'room', None):
		return []
	messages = (
		Message.objects.filter(room=game.room)
		.select_related('sender_profile')
		.order_by('created')
	)
	return RoomHistorySerializer(messages, many=True).data

async def send_join_chatroom(consumer) -> None:
	"""Send persisted chat room history to the joining websocket client."""
	history = await get_join_history(consumer.current_game)
	await consumer.send_json({
		'target': 'game',
		'event': 'game-chat-history',
		'game_chat': history,
	})

@database_sync_to_async
def get_recipient_uids(game) -> list[str]:
	"""Return the profile uids of all current game players."""
	if not getattr(game, 'pk', None):
		return []
	return [str(uid) for uid in game.players.values_list('uid', flat=True)]


def chat_message_payload(message: Message, sender: str) -> dict[str, object]:
	"""Build the websocket payload shared by chat and game chat messages."""
	#TODO check the message, sender,  we need uid or id
	return {
		'type': 'game.chat.message',
		'uid': str(message.uid),
		'message': {
			'body': message.body,
			'uid': str(message.uid),
			'sender': LightProfileSerializer(message.sender_profile).data,
		},
		'sender': sender,
		'created': message.created.isoformat() if message.created else None,
	}

async def broadcast_message(consumer: 'GlobalConsumer', message: Message) -> None:
	"""Broadcast a live game-room chat message to everyone in the game group."""
	payload = chat_message_payload(message, consumer._sender_name())
	if getattr(consumer, 'current_game', None):
		recipient_uids = await get_recipient_uids(consumer.current_game)
		logger.debug('broadcast_message recipients=%s game=%s', recipient_uids, getattr(consumer.current_game, 'uid', None))
		for recipient_uid in recipient_uids:
			await consumer.group_send(f'user_{recipient_uid}', payload)
		return
	await consumer.group_send(f'user_{consumer.profile.uid}', payload)


async def handle_game_chat_payload(consumer: 'GlobalConsumer', content: dict) -> None:
	"""Handle chat messages that belong to the current game room."""
	body = str(content.get('message', '')).strip()
	if not body:
		await consumer.send_json({'type': 'error', 'message': 'message is required'})
		return
	success, message = await consumer._save_message(body, 'chat-message', content)
	if not success:
		logger.warning(
			'ws.chat_message.save_failed profile_id=%s error=%s',
			getattr(getattr(consumer, 'profile', None), 'id', None),
			message,
		)
		await consumer.send_json(message)
		return

	logger.info(
		'ws.chat_message.saved profile_id=%s message_uid=%s room_uid=%s',
		getattr(getattr(consumer, 'profile', None), 'id', None),
		message.uid,
		message.room.uid,
	)
	if consumer.current_game and not message.room.is_direct:
		await broadcast_message(consumer, message)
		return
	payload = chat_message_payload(message, consumer._sender_name())
	await consumer.group_send(f'user_{consumer.profile.uid}', payload)




#TODO Not yet call this function, maybe need to delete at the end, will see 
@database_sync_to_async
def create_chat_message(room: Room, sender_profile, body: str) -> Message:
	"""Persist a room message that can later be replayed from chat history."""
	return Message.objects.create(
		sender_profile=sender_profile,
		room=room,
		body=body,
	)
async def send_room_message(consumer: 'GlobalConsumer', body: str, group: str, room: Room) -> None:
	"""Create room message and broadcast it to the supplied websocket group."""
	if not room or not getattr(consumer, 'profile', None):
		return
	message = await create_chat_message(room, consumer.profile, body)
	# broadcast using per-user groups so game events delivered in expected order
	if getattr(consumer, 'current_game', None):
		payload = chat_message_payload(message, consumer._sender_name())
		recipient_uids = await get_recipient_uids(consumer.current_game)
		logger.debug('send_room_message recipients=%s room=%s', recipient_uids, getattr(room, 'uid', None))
		for recipient_uid in recipient_uids:
			await consumer.group_send(f'user_{recipient_uid}', payload)
		return
	await consumer.group_send(f'user_{consumer.profile.uid}', chat_message_payload(message, consumer._sender_name()))
