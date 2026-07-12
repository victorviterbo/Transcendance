"""Prepare a fresh local database for development and evaluation."""
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connections


class Command(BaseCommand):
	"""Run migrations and explicit seed commands in the correct order."""

	help = "Run migrate, seed_playlists, sync_playlists, and seed_database."

	def handle(self, *args, **options):
		for command in (
			"migrate",
			"seed_playlists",
			"sync_playlists",
			"seed_database",
		):
			call_command(command)
			connections.close_all()
		self.stdout.write(self.style.SUCCESS("Fresh database is ready."))
