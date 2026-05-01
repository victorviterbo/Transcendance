"""Define the statistics model."""

from __future__ import annotations

import uuid

from chat.models import Room
from django.db import models
from music.models import Playlist, Track
from userprofile.models import Profile


class Game(models.Model):
	"""Define the model for a single game session."""

	game_name = models.CharField(max_length=50)
	
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
	
	playback_duration = models.DurationField(null=True, blank=True)

	break_duration = models.DurationField(null=True, blank=True)

	answer_public = models.BooleanField(default=False)

	game_mode = models.CharField(max_length=20,
								choices=[
									('normal', 'GAME_MODE_NORMAL'),
									('speed', 'GAME_MODE_SPEED'),
									('armagedon', 'GAME_MODE_ARMAGEDON'),
									],
								default='normal')
	
	current_round = models.PositiveIntegerField(default=0)
	
	current_track = models.ForeignKey(Track,
										on_delete=models.SET_NULL,
										null=True,
										blank=True,
										related_name='current_in_games')
	
	max_rounds = models.PositiveIntegerField(default=5)

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

	class Meta:
		"""Define special behaviour of database."""
		ordering = ['-played_at']
