import bisect

def get_badge(number):
    breakpoints = [100, 200, 500, 1000, 2000, 5000, 100000]
    values = ["Deaf Octopus", # <100
              "Dazed Jellyfish", # < 200 
              "Distracted Pigeon", # < 500 
              "Curious Cat", # < 1000 
              "Attentive Owl", # < 2000
              "Rhythmic Raptor", # < 5000
              "Sonic Shark", # < 10000
              "Echolocating Bat" # > 100000
              ]
    
    index = bisect.bisect_right(breakpoints, number)
    return values[index]