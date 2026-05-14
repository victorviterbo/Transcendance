"""Define defaults values for the game."""

import bisect

from project import settings

badges_strings = ['BADGE_DEAF_OCTOPUS', # <100
                  'BADGE_DAZED_JELLYFISH', # < 200 
                  'BADGE_DISTRACTED_PIGEON', # < 500 
                  'BADGE_CURIOUS_CAT', # < 1000 
                  'BADGE_ATTENTIVE_OWL', # < 2000
                  'BADGE_RHYTHMIC_RAPTOR', # < 5000
                  'BADGE_SONIC_SHARK', # < 10000
                  'BADGE_ECHOLOCATING_BAT' # > 10000
                 ]

def get_badge(number: int) -> str:
    """Define badges given depending on xp."""
    breakpoints = [100, 200, 500, 1000, 2000, 5000, 10000]
    index = bisect.bisect_right(breakpoints, number)
    return badges_strings[index]


def get_avatar_url(profile) -> str:  # noqa: ANN001
    """Return the absolute URL of a profile's avatar."""
    if profile.avatar and hasattr(profile.avatar, 'url'):
        return profile.avatar.url
    else:
        return (settings.STATIC_URL + \
            f"default_avatars/default_avatar_{profile.pk % 18}.png")


genres = ['Rock', 'Pop', 'Rap', 'Electro', 'French Variety', 'RNB']

num_genres = len(genres)

genres_to_label = {
    'Rock': 'TAG_ROCK',
    'Pop': 'TAG_POP',
    'Rap': 'TAG_RAP',
    'Electro': 'TAG_ELECRO',
    'French Variety': 'TAG_FRENCH_VARIETY',
    'RNB': 'TAG_RNB'
}

default_pts = {
    'armagedon': {
        'both': 10,
        'artist': 4,
        'song': 4
    },
    'speed': {
        'artist': 5,
        'song': 5
    },
    'normal': {
        'both': 10,
        'artist': 4,
        'song': 4
    }
}

countdown_time = 3
answer_buffer_time = 0.2