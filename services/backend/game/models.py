"""Define the statistics model."""

from __future__ import annotations

import uuid
from datetime import timedelta

from chat.models import Room
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from music.models import Playlist, Track
from userprofile.models import Profile


def _default_genres():
	return ['Pop']

class Game(models.Model):
	"""Define the model for a single game session."""

	game_name = models.CharField(max_length=100)
	
	genres = models.JSONField(default=['Pop'], blank=True) #TODO switch default to callable
	
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
									('playing_round', 'Game Round in progress'),
									('playing_break', 'Game Break in progress'),
									('finished', 'Game finished'),
									],
									default='waiting')
	
	playback_duration = models.DurationField(
		null=True,
		blank=True,
		default=timedelta(seconds=30),
		validators=[
			MinValueValidator(timedelta(seconds=5)),
			MaxValueValidator(timedelta(seconds=30)),
		],
	)

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
	
	num_tracks = models.PositiveIntegerField(
		default=5,
		validators=[MinValueValidator(1), MaxValueValidator(100)],
	)

	created_at = models.DateTimeField(auto_now_add=True)
	
	started_at = models.DateTimeField(null=True, blank=True)

	uid = models.UUIDField(default=uuid.uuid4,
						editable=False,
						unique=True,
						db_index=True)

	public_level = models.CharField(max_length=20,
								choices=[
									('public', 'PUBLIC'),
									('friends_only', 'FRIENDS_ONLY'),
									('invite_only', 'INVITE_ONLY'),
									],
								)

	fuzzy_match = models.BooleanField(default=True)

	owned_by = models.ForeignKey(Profile,
								on_delete=models.SET_NULL,
								null=True,
								related_name='owned_games')

	class Meta:
		"""Define special behaviour of database."""
		ordering = ['-created_at']
