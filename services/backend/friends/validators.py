"""Validation policy for social inputs."""

from rest_framework import serializers


SOCIAL_SEARCH_MAX_LENGTH = 20


def validate_social_search_query(value: object) -> str:
    """Return a normalized social search query or raise a validation error."""
    query = str(value or '').strip()
    if not query:
        raise serializers.ValidationError('Search is required', code='empty')
    if len(query) > SOCIAL_SEARCH_MAX_LENGTH:
        raise serializers.ValidationError('Search too long', code='max_length')
    return query
