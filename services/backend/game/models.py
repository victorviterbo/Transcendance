"""Define the statistics model."""

from __future__ import annotations

import uuid
from datetime import timedelta

from chat.models import Room
from django.db import models
from music.models import Playlist, Track
from userprofile.models import Profile


class Game(models.Model):
	"""Define the model for a single game session."""

	game_name = models.CharField(max_length=100, blank=True, default='')
	
	genres = models.JSONField(default=list)
	
	players = models.ManyToManyField(Profile,
									through='stats.UserGameStats',
									related_name='games_played'
									)
	
	room = models.OneToOneField(Room,
								on_delete=models.SET_NULL,
								null=True)
	
	
	
	playlist = models.ForeignKey(Playlist,
									on_delete=models.SET_NULL,
									null=True,
									related_name='games')
	
	status = models.CharField(max_length=20,
								choices=[
									('waiting', 'Waiting for players'),
									('playing', 'Game in progress'),
									('finished', 'Game finished'),
									],
									default='waiting')
	
	playback_duration = models.DurationField(null=True,
										blank=True,
										default=timedelta(seconds=30))

	break_duration = models.DurationField(null=True,
                                          blank=True,
                                          default=timedelta(seconds=10)
									)

	answer_public = models.BooleanField(default=False)

	game_mode = models.CharField(max_length=20,
								choices=[
									('normal', 'GAME_MODE_NORMAL'),
									('speed', 'GAME_MODE_SPEED'),
									('armagedon', 'GAME_MODE_ARMAGEDON'),
									],
								default='normal')
	
	current_round = models.PositiveIntegerField(default=1)
	
	current_track = models.ForeignKey(Track,
										on_delete=models.SET_NULL,
										null=True,
										blank=True,
										related_name='current_in_games')
	
	num_tracks = models.PositiveIntegerField(default=5)

	played_at = models.DateTimeField(auto_now_add=True)
	
	started_at = models.DateTimeField(null=True, blank=True)

	uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

	public_level = models.CharField(max_length=20,
								choices=[
									('public', 'PUBLIC'),
									('friends_only', 'FRIENDS_ONLY'),
									('invite_only', 'INVITE_ONLY'),
									],
								default='public')

	fuzzy_match = models.BooleanField(default=True)

	class Meta:
		"""Define special behaviour of database."""
		ordering = ['-played_at']

	def save(self, *args, **kwargs):
		"""Auto-generate game_name from genres and uid if not provided."""
		if not self.game_name and self.genres:
			genres_str = ' - '.join(self.genres)
			self.game_name = f"{genres_str} - {self.uid}"
		super().save(*args, **kwargs)
