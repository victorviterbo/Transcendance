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
	if isinstance(error, list):
		error = {'non_field_errors': error}
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
