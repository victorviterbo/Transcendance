"""Define the statistics model."""

from __future__ import annotations

import uuid

from chat.models import Room
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from music.models import Playlist, Track
from userprofile.models import Profile


def _default_genres() -> list:
    """Callable for default genres values."""
    return ['Pop']

class Game(models.Model):
    """Define the model for a single game session."""

    name = models.CharField(max_length=100)
    
    genres = models.JSONField(default=_default_genres, blank=True)
    
    players = models.ManyToManyField(Profile,
                                    through='stats.UserGameStats',
                                    related_name='games_played'
                                    )
    
    room = models.OneToOneField(Room,
                                on_delete=models.CASCADE,
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
    
    playbackDuration = models.FloatField(
        null=True,
        blank=True,
        default=30,
        validators=[
            MinValueValidator(5),
            MaxValueValidator(30),
        ],
    )

    breakDuration = models.FloatField(null=True,
                                        blank=True,
                                        default=10,
                                        validators=[
                                            MinValueValidator(1),
                                            MaxValueValidator(30),
                                        ]
                                )

    mode = models.CharField(max_length=20,
                                choices=[
                                    ('normal', 'GAME_MODE_NORMAL'),
                                    ('speed', 'GAME_MODE_SPEED'),
                                    ('armageddon', 'GAME_MODE_ARMAGEDDON'),
                                    ],
                                default='normal')
    
    current_round = models.PositiveIntegerField(default=1)
    
    current_track = models.ForeignKey(Track,
                                        on_delete=models.SET_NULL,
                                        null=True,
                                        blank=True,
                                        related_name='current_in_games')
    
    trackCount = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    
    started_at = models.DateTimeField(null=True, blank=True)

    uid = models.UUIDField(default=uuid.uuid4,
                        editable=False,
                        unique=True,
                        db_index=True)

    visibility = models.CharField(max_length=20,
                                choices=[
                                    ('public', 'PUBLIC'),
                                    ('friends', 'FRIENDS'),
                                    ('private', 'PRIVATE'),
                                    ],
                                )

    fuzzy = models.BooleanField(default=True)

    reveal = models.BooleanField(default=False)

    owned_by = models.ForeignKey(Profile,
                                on_delete=models.SET_NULL,
                                null=True,
                                related_name='owned_games')

    class Meta:
        """Define special behaviour of database."""
        ordering = ['-created_at']
