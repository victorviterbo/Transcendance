"""Define defaults values for the game."""

import bisect

badges_strings = ["Deaf Octopus", # <100
                  "Dazed Jellyfish", # < 200 
                  "Distracted Pigeon", # < 500 
                  "Curious Cat", # < 1000 
                  "Attentive Owl", # < 2000
                  "Rhythmic Raptor", # < 5000
                  "Sonic Shark", # < 10000
                  "Echolocating Bat" # > 100000
                 ]

def get_badge(number: int) -> str:
    """Define badges given depending on xp."""
    breakpoints = [100, 200, 500, 1000, 2000, 5000, 100000]
    index = bisect.bisect_right(breakpoints, number)
    return badges_strings[index]