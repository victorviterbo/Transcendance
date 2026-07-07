"""Prepare a fresh local database for development and evaluation."""
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
	"""Run migrations and explicit seed commands in the correct order."""

	help = "Run migrate, seed_playlists, sync_playlists, and seed_database."

	def handle(self, *args, **options):
		call_command("migrate")
		call_command("seed_playlists")
		call_command("sync_playlists")
		call_command("seed_database")
		self.stdout.write(self.style.SUCCESS("Fresh database is ready."))
