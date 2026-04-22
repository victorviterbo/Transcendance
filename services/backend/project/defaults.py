"""Define defaults values for the game."""

import bisect

badges_strings = ["BADGE_DEAF_OCTOPUS", # <100
                  "BADGE_DAZED_JELLYFISH", # < 200 
                  "BADGE_DISTRACTED_PIGEON", # < 500 
                  "BADGE_CURIOUS_CAT", # < 1000 
                  "BADGE_ATTENTIVE_OWL", # < 2000
                  "BADGE_RHYTHMIC_RAPTOR", # < 5000
                  "BADGE_SONIC_SHARK", # < 10000
                  "BADGE_ECHOLOCATING_BAT" # > 10000
                 ]

def get_badge(number: int) -> str:
    """Define badges given depending on xp."""
    breakpoints = [100, 200, 500, 1000, 2000, 5000, 100000]
    index = bisect.bisect_right(breakpoints, number)
    return badges_strings[index]


kinds = ['Rock', 'Pop', 'Rap', 'Electro', 'French Variety', 'RNB']

kinds_to_label = {
    'Rock': 'TAG_ROCK',
    'Pop': 'TAG_POP',
    'Rap': 'TAG_RAP',
    'Electro': 'TAG_ELECRO',
    'French Variety': 'TAG_FRENCH_VARIETY',
    'RNB': 'TAG_RNB'
}
