"""Helpers for sending game-linked chat history over websocket."""
from typing import Any
from channels.db import database_sync_to_async

from .models import Message, Room
from .serializers import RoomHistorySerializer


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
		'target': 'chat',
		'event': 'history',
		'chat': history,
	})

@database_sync_to_async
def get_recipient_uids(game) -> list[str]:
	"""Return the profile uids of all current game players."""
	if not getattr(game, 'pk', None):
		return []
	return [str(uid) for uid in game.players.values_list('uid', flat=True)]


def chat_message_payload(message: Message, sender: str) -> dict[str, object]:
	"""Build the websocket payload shared by chat and game chat messages."""
	return {
		'type': 'chat.message',
		'message_uid': str(message.uid),
		'message': message.body,
		'sender': sender,
		'created': message.created.isoformat(),
		'delivered': message.delivered,
		'seen': message.seen,
	}

async def broadcast_message(consumer: Any, message: Message) -> None:
	"""Broadcast a live game-room chat message to everyone in the game group."""
	payload = chat_message_payload(message, consumer._sender_name())
	if getattr(consumer, 'current_game', None):
		recipient_uids = await get_recipient_uids(consumer.current_game)
		for recipient_uid in recipient_uids:
			await consumer.group_send(f'user_{recipient_uid}', payload)
		return
	await consumer.group_send(f'user_{consumer.profile.uid}', payload)