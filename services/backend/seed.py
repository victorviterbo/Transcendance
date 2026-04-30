"""Seed the database with initial data for testing purposes."""
import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from friends.models import Friendship
from game.models import Game
from music.models import Track
from project.defaults import genres
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from userauth.models import SiteUser
from userprofile.models import Profile

User = get_user_model()

print("Seeding database...")

# ---------------------------------------------------------
# 1. MOCK DEPENDENCIES (Tracks & Rooms)
# ---------------------------------------------------------
print("Creating Tracks and Rooms...")
tracks = []
# Note: Adjust the fields here based on your actual Track model
#for i in range(1, 16):
#    track, _ = Track.objects.get_or_create(id=i) 
#    tracks.append(track)
    
"""rooms = []
# Note: Adjust the fields here based on your actual Room model
for i in range(1, 6):
    room, _ = Room.objects.get_or_create(id=i)
    rooms.append(room)"""

# ---------------------------------------------------------
# 2. USERS & PROFILES
# ---------------------------------------------------------
print("Creating Users and Profiles...")
users = []
profiles = []

# Create 1 Admin
admin_user, _ = SiteUser.objects.get_or_create(email='admin@example.com',
                                               defaults={'is_staff': True, 'is_superuser': True})
admin_user.set_password('Password123!')
admin_user.save()

admin_profile, _ = Profile.objects.get_or_create(
    user=admin_user,
    defaults={'username': 'admin_master', 'exp_points': 9999, 'is_guest': False}
)
users.append(admin_user)
profiles.append(admin_profile)

# Create 20 Standard Users
for i in range(1, 21):
    email = f"player{i}@mail.com"
    user, created = SiteUser.objects.get_or_create(email=email)
    if created:
        user.set_password('Password123!')
        user.save()
    users.append(user)
    
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={
            'username': f"Player_{i}",
            'exp_points': random.randint(100, 5000),
            'is_guest': False
        }
    )
    profiles.append(profile)

# ---------------------------------------------------------
# 3. FRIENDSHIPS
# ---------------------------------------------------------
print("Forging Friendships...")
for _ in range(30): # Create 30 random friend connections
    u1, u2 = random.sample(users, 2)
    
    # Check constraints before creating to avoid UniqueConstraint errors
    exists = Friendship.objects.filter(from_user=u1, to_user=u2).exists() or \
                Friendship.objects.filter(from_user=u2, to_user=u1).exists()
                
    if not exists:
        Friendship.objects.create(
            from_user=u1, 
            to_user=u2, 
            status=random.choice(['pending', 'accepted'])
        )


for t_idx in range(1, 16):
    track, created = Track.objects.get_or_create(
        itunes_id=t_idx,
        title=f"Track {t_idx}",
        artist=f"Artist {t_idx}",
        preview_url=f"https://example.com/preview{t_idx}.mp3",
        artwork_url=f"https://example.com/artwork{t_idx}.jpg",
        genre=random.choice(genres)
    )
    tracks.append(track)
# ---------------------------------------------------------
# 4. GAMES & STATS
# ---------------------------------------------------------
# Simulate 10 different games
for g_idx in range(1, 11):
    # Pick a random room and random 4 players for the game
    #game_room = random.choice(rooms)
    game_players = random.sample(profiles, 4)
    
    game = Game.objects.create(
        game_name=f"Blind Test Arena {g_idx}",
        status='finished',
        max_rounds=20
    )
    
    # Pick an overall winner for the game
    game_winner = random.choice(game_players)
    
    # Create UserGameStats (Overall Game Results)
    for player in game_players:
        UserGameStats.objects.create(
            game=game,
            player=player,
            is_won=(player == game_winner)
        )
    # Simulate 5 rounds per game
    for round_num in range(1, 6):
        track = random.choice(tracks)

        game_round = GameRoundStats.objects.create(
            round_number=round_num,
            game=game,
            track=track
        )
        # Create UserRoundStats (Individual performance in that round)
        for player in game_players:
            # Add some randomness to how they performed
            found_artist = random.choice([True, False])
            found_song = random.choice([True, False])
            
            # Base XP logic
            xp = 0
            if found_artist:
                xp += 10
            if found_song:
                xp += 10
            UserRoundStats.objects.create(
                player=player,
                round=game_round,
                artist_found=found_artist,
                song_found=found_song,
                artist_found_at=timedelta(seconds=random.randint(5, 30)),
                song_found_at=timedelta(seconds=random.randint(5, 30)),
                time=timedelta(seconds=random.randint(5, 30)),
                xp_earned=xp
            )
        

print("✅ Success! The database is now heavily seeded.")

"""if __name__ == "__main__":
    run()
"""