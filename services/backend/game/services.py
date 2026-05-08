"""Business logic helpers for game creation and setup."""

import random
import uuid

from chat.models import Room
from music.models import Playlist, Track
from rest_framework import serializers

from game.models import Game


def setup_game_assets(game: Game) -> None:
	"""Create the playlist, room, and current track for a validated game."""
	if not game.genres:
		return

	tracks_per_genre = game.num_tracks // len(game.genres)
	all_tracks = list()
	for genre in game.genres:
		genre_tracks = list(
			Track.objects.filter(genre__iexact=genre).order_by('?')[:tracks_per_genre]
		)
		if len(genre_tracks) < tracks_per_genre:
			raise serializers.ValidationError(
				'Not enough tracks for genre: ' + genre,
				code='NOT_ENOUGH_TRACKS_GENRE',
			)
		all_tracks.extend(genre_tracks)

	if not all_tracks:
		raise serializers.ValidationError(
			'No tracks available for the selected genres',
			code='NO_TRACKS_FOUND',
		)

	random.shuffle(all_tracks)
	playlist_uid = uuid.uuid4()
	genre_str = ', '.join(game.genres)
	playlist = Playlist.objects.create(
		name=f'Game Playlist - {genre_str} ({playlist_uid})',
		uid=playlist_uid,
	)
	playlist.tracks.set(all_tracks)

	room_uid = uuid.uuid4()
	room = Room.objects.create(
		name=f"Game Room - {', '.join(game.genres)} ({room_uid})",
		is_direct=False,
		uid=room_uid,
	)
	game.playlist = playlist
	game.current_track = all_tracks[0]
	game.room = room
	game.save(update_fields=['playlist', 'current_track', 'room'])