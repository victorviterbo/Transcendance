"""Shared helpers for chat room and direct-message logic."""

from friends.models import Friendship
from userprofile.models import Profile

from .models import Room


def direct_key_for(profile_a: Profile, profile_b: Profile) -> str:
    """Return the canonical key for a private direct-message room."""
    """Generate a stable, unique key for a direct message room between two users.

    Ensures Alice↔Bob has the same key regardless of call order.

    Args:
        profile_a, profile_b: User's Profile objects
    
    Returns:
        String key 'user_<min_id>_user_<max_id>'
    """
    id_a, id_b = profile_a.id, profile_b.id
    min_id, max_id = (id_a, id_b) if id_a < id_b else (id_b, id_a)
    return f'user_{min_id}_user_{max_id}'


def accepted_friendship_exists(profile_a: Profile, profile_b: Profile) -> bool:
    """Return whether the two users are connected by an accepted friendship."""
    user_a = profile_a.user
    user_b = profile_b.user
    return Friendship.objects.filter(
        status='accepted',
        from_user__in=[user_a, user_b],
        to_user__in=[user_a, user_b],
    ).exists()


def get_or_create_direct_room(profile_a: Profile, profile_b: Profile) -> tuple[Room, bool]:
    """Get or create the canonical direct room for two profiles."""
    direct_key = direct_key_for(profile_a, profile_b)
    return Room.objects.get_or_create(
        direct_key=direct_key,
        defaults={
            'name': direct_key,
            'is_direct': True,
        },
    )