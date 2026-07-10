"""Validation policy for chat payloads."""

from django.core.validators import MaxLengthValidator
from rest_framework import serializers


CHAT_MESSAGE_MAX_LENGTH = 500


def validate_chat_message_body(value: object) -> str:
    """Return a normalized chat message body or raise a validation error."""
    body = str(value or '').strip()
    if not body:
        raise serializers.ValidationError('Message is required', code='blank')
    if len(body) > CHAT_MESSAGE_MAX_LENGTH:
        raise serializers.ValidationError('Message too long', code='max_length')
    return body


chat_message_body_validators = [
    MaxLengthValidator(CHAT_MESSAGE_MAX_LENGTH),
]
