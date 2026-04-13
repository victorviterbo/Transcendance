"""Define the statistics model."""

from __future__ import annotations

import uuid

from chat.models import Room
from django.db import models
from django.utils import timezone
from music.models import Playlist, Track
from userprofile.models import Profile


class Game(models.Model):
	"""Define the model for a single game session."""

	game_name = models.CharField(max_length=50)
	
	players = models.ManyToManyField(Profile,
									 through='stats.UserGameStats')
	
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
	
	current_round = models.PositiveIntegerField(default=0)
	
	current_track = models.ForeignKey(Track,
									  on_delete=models.SET_NULL,
									  null=True,
									  blank=True,
									  related_name='current_in_games')
	
	round_end_time = models.DateTimeField(null=True, blank=True)
	
	max_rounds = models.PositiveIntegerField(default=5)
	
	started_at = models.DateTimeField(null=True, blank=True)

	uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

	is_public = models.BooleanField(default=False)

	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		"""Define special behaviour of database."""
		ordering = ['-created_at']
