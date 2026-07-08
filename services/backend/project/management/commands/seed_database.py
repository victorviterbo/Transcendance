"""Seed demo users, friendships, games, and stats."""
import random
import uuid

from django.core.management.base import BaseCommand
from django.db import transaction
from friends.models import Friendship
from game.models import Game
from music.models import Playlist, Track
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from userauth.models import SiteUser
from userprofile.models import Profile


DEMO_PASSWORD = "Password123+"


class Command(BaseCommand):
	"""Create demo data for local development and evaluation."""

	help = "Seed demo users, friendships, games, and stats."

	def handle(self, *args, **options):
		random.seed(42)
		with transaction.atomic():
			users, profiles = self._create_users()
			self._create_friendships(users)
			games_created = self._create_games(profiles)

		self.stdout.write(self.style.SUCCESS(
			f"Seeded {len(users)} users and {games_created} demo games."
		))

	def _create_users(self) -> tuple[list[SiteUser], list[Profile]]:
		users = []
		profiles = []

		for i in range(1, 21):
			email = f"player{i}@mail.com"
			user, _ = SiteUser.objects.get_or_create(email=email)
			user.set_password(DEMO_PASSWORD)
			user.save()
			profile, _ = Profile.objects.update_or_create(
				user=user,
				defaults={
					"username": f"Player_{i}",
					"exp_points": random.randint(100, 5000),
					"guest": False,
					"is_online": False,
				},
			)
			users.append(user)
			profiles.append(profile)

		return users, profiles

	def _create_friendships(self, users: list[SiteUser]) -> None:
		for _ in range(30):
			from_user, to_user = random.sample(users, 2)
			reverse_exists = Friendship.objects.filter(
				from_user=to_user,
				to_user=from_user,
			).exists()
			if reverse_exists:
				continue
			Friendship.objects.get_or_create(
				from_user=from_user,
				to_user=to_user,
				defaults={"status": random.choice(["pending", "accepted"])},
			)

	def _create_games(self, profiles: list[Profile]) -> int:
		tracks = list(Track.objects.all())
		if not tracks:
			self.stdout.write(self.style.WARNING(
				"No tracks found. Skipping demo game history."
			))
			return 0

		games_created = 0

		for game_index in range(1, 11):
			players = random.sample(profiles, 4)
			game_tracks = random.sample(tracks, min(5, len(tracks)))
			owner = players[0]
			winner = random.choice(players)
			
			playlist = Playlist.objects.create(
				name=f"Blind Test Playlist {game_index}",
				uid=uuid.uuid4()
			)
			playlist.tracks.set(game_tracks)
			
			game = Game.objects.create(
				name=f"Blind Test Arena {game_index}",
				status="finished",
				visibility="public",
				owned_by=owner,
				playlist=playlist,
				current_round=len(game_tracks),
				current_track=game_tracks[-1],
				trackCount=len(game_tracks),
			)

			game_stats_by_player = {}
			for player in players:
				game_stats_by_player[player.pk] = UserGameStats.objects.create(
					game=game,
					player=player,
					is_won=(player == winner),
				)

			for round_number, track in enumerate(game_tracks, start=1):
				game_round = GameRoundStats.objects.create(
					round_number=round_number,
					game=game,
					track=track,
				)
				round_results = []
				for player in players:
					found_artist = random.choice([True, False])
					found_title = random.choice([True, False])
					xp = (10 if found_artist else 0) + (10 if found_title else 0)
					round_results.append((player, found_artist, found_title, xp))

				ranking_by_player = {
					player.pk: rank
					for rank, (player, *_rest) in enumerate(
						sorted(round_results, key=lambda result: result[3], reverse=True),
						start=1,
					)
				}
				for player, found_artist, found_title, xp in round_results:
					UserRoundStats.objects.create(
						player=player,
						round=game_round,
						game_stats=game_stats_by_player[player.pk],
						artist_found=found_artist,
						title_found=found_title,
						artist_found_at=random.randint(5, 30) if found_artist else -1,
						title_found_at=random.randint(5, 30) if found_title else -1,
						xp_earned=xp,
						ranking=ranking_by_player[player.pk],
					)

			games_created += 1

		return games_created
