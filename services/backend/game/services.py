"""Business logic helpers for game creation and setup."""

import random
import uuid
from typing import Any

from chat.models import Room
from music.models import Playlist, Track
from rest_framework import serializers

from game.models import Game


def format_validation_errors(val_error: serializers.ValidationError) -> dict[str, dict[str, str | list[str]]]:
	"""Normalize DRF validation errors to the API error contract."""
	error = val_error.get_full_details()
	error_response: dict[str, dict[str, str | list[str]]] = {'error': {}}
	for field, details in error.items():
		if not isinstance(details, list) or len(details) == 0:
			continue
		if not isinstance(details[0], dict) or 'code' not in details[0]:
			continue
		error_code = details[0].get('code') if isinstance(details[0], dict) else None
		if not error_code:
			error_response['error'][field] = 'UNKNOWN_ERROR'
		elif field == 'non_field_errors':
			error_response['error']['non_field'] = error_code.upper()
		elif error_code in ['required',
							'invalid',
							'empty',
							'min_value',
							'max_value',
							'blank',
							'min_length',
							'max_length',
							'not_a_list',
							'invalid_choice']:
			error_response['error'][field] = f'{error_code.upper()}_{field.upper()}'
		else:
			error_response['error'][field] = error_code.upper()
	return error_response


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