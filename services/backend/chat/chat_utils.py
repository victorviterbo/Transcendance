"""Shared helpers for chat room and direct-message logic."""

from chat.models import Message
from friends.models import Friendship
from userprofile.models import Profile
from userauth.models import SiteUser

from .models import Room

def direct_key(profile_a: Profile, profile_b: Profile) -> str:
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

def accepted_friendship(profile_a: Profile, profile_b: Profile) -> bool:
    """Return whether the two users are connected by an accepted friendship."""
    user_a = profile_a.user
    user_b = profile_b.user
    return Friendship.objects.filter(
        status='accepted',
        from_user__in=[user_a, user_b],
        to_user__in=[user_a, user_b],
    ).exists()

def create_direct_room(profile_a: Profile, profile_b: Profile) -> Room:
    """Return the direct room shared by two profiles, creating it if necessary."""
    key = direct_key(profile_a, profile_b)
    
    room, created = Room.objects.get_or_create(
        direct_key=key,
        defaults={
            'name': key,
            'is_direct': True,
        },
    )
    if created:
        room.participants.add(profile_a, profile_b)

    return room

def resolve_recipient_user(recipient_uid: str | None) -> SiteUser | None:
    """Resolve a recipient user from either SiteUser.uid or Profile.uid.

    Returns a SiteUser if found, otherwise None. This centralises lookup logic
    used by HTTP views and other callers.
    """
    if recipient_uid is None:
        return None

    user = SiteUser.objects.filter(uid=recipient_uid).select_related('profile').first()
    if user:
        return user

    profile = Profile.objects.filter(uid=recipient_uid).select_related('user').first()
    if not profile:
        return None
    return profile.user