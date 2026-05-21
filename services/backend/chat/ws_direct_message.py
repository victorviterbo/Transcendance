"""Direct message WebSocket helper functions for async database operations."""

import logging

from channels.db import database_sync_to_async
from chat.models import Message
from django.core.cache import cache
from django.db import models
from userprofile.models import Profile

logger = logging.getLogger(__name__)

async def update_online_status(consumer, current_profile_id: int, is_online: bool) -> bool:
    """Update online status for a profile and refresh delivery status.
    Use uid for wedsocket and use `id` for backend hat open close check"""
    if current_profile_id is None:
        return False
    updated_row = await set_online_status(current_profile_id, is_online)
    if updated_row == 0:
        logger.info('ws.presence.skip_missing_profile profile_id=%s desired_online=%s',
                    current_profile_id,
                    is_online)
        return False
    if is_online:
        pending_message = await get_pending_message(current_profile_id)
        await mark_pendmessage_delivered(current_profile_id)

        for ref in pending_message:
            sender_profile_id = ref.get('sender_profile_id')
            sender_profile_uid = ref.get('sender_profile_uid')
            if sender_profile_id and sender_profile_uid and await is_chat_open(sender_profile_id, current_profile_id):
                await consumer.group_send(f'user_{sender_profile_uid}', {
                    'type': 'send.notification',
                    'payload': {
                        'target': 'friend-chat',
                        'event': 'update_status',
                        'message': {
                            'uid': str(ref.get('uid')),
                            'status': 'recieved',
                        },
                    },
                })
    return True

@database_sync_to_async
def set_online_status(current_profile_id: int, is_online: bool) -> int:
    """Set the profile online flag and return updated row count."""
    return Profile.objects.filter(id=current_profile_id).update(is_online=is_online)

@database_sync_to_async
def get_pending_message(recipient_profile_id: int) -> list[dict[str, int]]:
    """Return pending direct-message refs for a profile."""
    return list(
        Message.objects.filter(
            room__is_direct=True,
            room__participants__id=recipient_profile_id,
            delivered=False,
        ).exclude(sender_profile__id=recipient_profile_id).values('uid', 'sender_profile_id')
        .annotate(sender_profile_uid=models.F('sender_profile__uid'))
    )
@database_sync_to_async
def mark_pendmessage_delivered(recipient_profile_id: int) -> int:
    """Mark pending direct messages as delivered."""
    return Message.objects.filter(
        room__is_direct=True,
        room__participants__id=recipient_profile_id,
        delivered=False,
    ).exclude(sender_profile_id=recipient_profile_id).update(delivered=True)


async def handle_chat_payload(consumer, content: dict, event: str | None) -> None:
    """Translate frontend friend-chat payloads into internal chat events."""
    if event == 'send':
        frontend_message = content.get('message')
        if not isinstance(frontend_message, dict):
            logger.warning(
                'ws.receive.invalid_friend_chat_payload profile_id=%s',
                getattr(getattr(consumer, 'profile', None), 'id', None),
            )
            await consumer.send_json({'type': 'error', 'message': 'message is r-àèequired'})
            return
        logger.info(
            'ws.receive.friend_chat_translate profile_id=%s target_id=%s message_len=%s',
            getattr(getattr(consumer, 'profile', None), 'id', None),
            frontend_message.get('target-id'),
            len(str(frontend_message.get('message', ''))),
        )
        await consumer.chat_subroutine({
            'event': 'direct-message',
            'message': frontend_message.get('message'),
            'user_uid': frontend_message.get('target-id'),
            '_frontend_contract': True,
        })
        return
    if event in ('open', 'close'):
        await consumer.chat_subroutine({
            'event': event,
            'target_uid': content.get('toUid'),
            '_frontend_contract': True,
        })
        return
    await consumer.send_json({'type': 'error', 'message': 'unsupported_event'})

@database_sync_to_async
def mark_message_delivered(message_uid) -> None:
    """Mark direct message as delivered in the database."""
    message = Message.objects.filter(uid=message_uid).first()
    if not message:
        return
    if not message.delivered:
        message.delivered = True
        message.save(update_fields=['delivered'])

@database_sync_to_async
def mark_message_seen(message_uid) -> None:
    """Mark message as seen in the database."""
    message = Message.objects.filter(uid=message_uid).first()
    if not message:
        return
    update_fields = []
    if not message.delivered:
        message.delivered = True
        update_fields.append('delivered')
    if not message.seen:
        message.seen = True
        update_fields.append('seen')
    if update_fields:
        message.save(update_fields=update_fields)

@database_sync_to_async
def is_chat_open(sender_profile_id: int, recipient_profile_id: int) -> bool:
    """Check whether the sender currently has the recipient chat open."""
    return bool(cache.get(f'chat_open:{sender_profile_id}:{recipient_profile_id}'))

@database_sync_to_async
def set_chat_open(sender_profile_id: int, recipient_profile_id: int, is_open: bool) -> None:
    """Set or clear the direct chat open state in cache."""
    key = f'chat_open:{sender_profile_id}:{recipient_profile_id}'
    if is_open:
        cache.set(key, True, timeout=180)
    else:
        cache.delete(key)

@database_sync_to_async
def get_recipient_profile(message: Message) -> Profile | None:
    """Return the other participant profile for a direct-message room."""
    return message.room.participants.exclude(id=message.sender_profile.id).first()
