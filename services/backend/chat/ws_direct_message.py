"""Direct message WebSocket helper functions for async database operations."""

import logging

from channels.db import database_sync_to_async
from chat.models import Message
from chat.serializers import FriendChatMessageSerializer
from django.core.cache import cache
from django.db import models
from userprofile.models import Profile

logger = logging.getLogger(__name__)

async def update_online_status(consumer, current_profile_id: int, is_online: bool) -> bool:
    """Update online status for a profile and refresh delivery status.
    uid used at wedsocket and API, `id` stay for internal database backend check open close messg"""
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
            sender_id = ref.get('sender_id')
            sender_uid = ref.get('sender_uid')
            if sender_id and sender_uid and await is_chat_open(sender_id, current_profile_id):
                await consumer.group_send(f'user_{sender_uid}', {
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
        )
        .exclude(sender__id=recipient_profile_id)
        .values('uid', 'sender_id')
        .annotate(sender_uid=models.F('sender__uid'))
    )
@database_sync_to_async
def mark_pendmessage_delivered(recipient_profile_id: int) -> int:
    """Mark pending direct messages as delivered."""
    return Message.objects.filter(
        room__is_direct=True,
        room__participants__id=recipient_profile_id,
        delivered=False,
    ).exclude(sender_id=recipient_profile_id).update(delivered=True)


async def handle_friend_chat_payload(consumer, content: dict, event: str | None) -> None:
    """Translate frontend friend-chat payloads into direct-message operations."""
    if event == 'send':
        frontend_message = content.get('message')
        if not isinstance(frontend_message, dict):
            logger.warning(
                'ws.receive.invalid_friend_chat_payload profile_id=%s',
                getattr(getattr(consumer, 'profile', None), 'id', None),
            )
            await consumer.send_json({'type': 'error', 'message': 'message is required'})
            return
        logger.info(
            'ws.receive.friend_chat_translate profile_id=%s target_id=%s message_len=%s',
            getattr(getattr(consumer, 'profile', None), 'id', None),
            frontend_message.get('target-id'),
            len(str(frontend_message.get('message', ''))),
        )
        await handle_direct_message(consumer, {
            'message': frontend_message.get('message'),
            'user_uid': frontend_message.get('target-id'),
            '_frontend_contract': True,
        })
        return
    if event in ('open', 'close'):
        await handle_chat_state_change(consumer, {
            'event': event,
            'target_uid': content.get('toUid'),
            '_frontend_contract': True,
        })
        return
    await consumer.send_json({'type': 'error', 'message': 'unsupported_event'})

async def handle_direct_message(consumer, content: dict) -> None:
    """Handle a direct-message payload from the websocket consumer."""
    body = str(content.get('message', '')).strip()
    if not body:
        await consumer.send_json({'type': 'error', 'message': 'message is required'})
        return
    success, message = await consumer._save_message(body, 'direct-message', content)
    if not success:
        expected_validation_errors = {'Target is not a friend', 'User not found'}
        message_text = message.get('message') if isinstance(message, dict) else None
        log_fn = logger.info if message_text in expected_validation_errors else logger.warning
        log_fn('ws.direct_message.save_failed profile_id=%s error=%s',
               getattr(getattr(consumer, 'profile', None), 'id', None),
               message)
        await consumer.send_json(message)
        return

    recipient_profile = await get_recipient_profile(message)
    if recipient_profile is None:
        logger.warning('ws.direct_message.no_recipient profile_id=%s message_uid=%s',
                       getattr(getattr(consumer, 'profile', None), 'id', None),
                       message.uid)
        await consumer.send_json({'type': 'error', 'message': 'Target user not found'})
        return

    if recipient_profile.is_online:
        recipient_chat_open = await is_chat_open(recipient_profile.id, consumer.profile.id)
        if recipient_chat_open:
            await mark_message_seen(message.uid)
            message.delivered = True
            message.seen = True
        elif not message.delivered:
            await mark_message_delivered(message.uid)
            message.delivered = True

    logger.info('ws.direct_message.sent sender_id=%s recipient_profile_id=%s message_uid=%s',
                getattr(getattr(consumer, 'profile', None), 'id', None),
                recipient_profile.id,
                message.uid)

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
            context={'recipient_profile': consumer.profile, 'direction': 'incoming'},
        ).data,
    }
    await consumer.group_send(f'user_{consumer.profile.uid}', {
        'type': 'send.notification',
        'payload': sender_payload,
    })
    if recipient_profile.is_online:
        await consumer.group_send(f'user_{recipient_profile.uid}', {
            'type': 'send.notification',
            'payload': recipient_payload,
        })


async def handle_chat_state_change(consumer, content: dict) -> None:
    """Handle open/close state changes for direct chat."""
    recipient_uid = content.get('target_uid')
    if not recipient_uid:
        await consumer.send_json({'type': 'error', 'message': 'target_uid is required'})
        return
    recipient_profile = await consumer.get_profile_by_uid(recipient_uid)
    if not recipient_profile:
        await consumer.send_json({'type': 'error', 'message': 'target_not_found'})
        return

    is_open = content.get('event') == 'open'
    await set_chat_open(consumer.profile.id, recipient_profile.id, is_open=is_open)
    if is_open:
        consumer.open_chat_recipient.add(recipient_profile.id)
    else:
        consumer.open_chat_recipient.discard(recipient_profile.id)

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
def is_chat_open(sender_id: int, recipient_profile_id: int) -> bool:
    """Check whether the sender currently has the recipient chat open."""
    return bool(cache.get(f'chat_open:{sender_id}:{recipient_profile_id}'))

@database_sync_to_async
def set_chat_open(sender_id: int, recipient_profile_id: int, is_open: bool) -> None:
    """Set or clear the direct chat open state in cache."""
    key = f'chat_open:{sender_id}:{recipient_profile_id}'
    if is_open:
        cache.set(key, True, timeout=180)
    else:
        cache.delete(key)

@database_sync_to_async
def get_recipient_profile(message: Message) -> Profile | None:
    """Return the other participant profile for a direct-message room."""
    return message.room.participants.exclude(id=message.sender.id).first()
