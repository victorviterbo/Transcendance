import asyncio
from typing import Any

from channels.db import database_sync_to_async
from django.db.models import Max, Sum, Q, Count
from music.serializers import BlindSerializer, TrackSerializer
from project.consumers import GlobalConsumer
from project.defaults import default_pts, countdown_time, answer_buffer_time
from rest_framework import serializers
from stats.models import GameRoundStats, UserGameStats, UserRoundStats
from stats.serializers import LiveGameSerializer, LiveRoundSerializer
from thefuzz import fuzz
from userprofile.models import Profile
from game.models import Game
from game.serializers import GameUpdateSerializer, GameHeaderSerializer
from game.services import apply_game_settings, format_validation_errors
from music.models import Track
from userprofile.serializers import LightProfileSerializer
from datetime import timedelta


async def _send_track(consumer: GlobalConsumer) -> None:
	"""Send the current track data to players at the start of a round."""
	track = consumer.current_game.current_track
	if not track:
		await consumer.group_send(consumer.group_name,{
						'target': 'game',
						'event': 'error',
						'message': 'No track to send'
		})
		return
	serialized_track = BlindSerializer(track).data
	serialized_game = GameHeaderSerializer(consumer.current_game).data
	event = {'type': 'game_round_start',
			'game': serialized_game,
			'playbackDuration': consumer.current_game.playback_duration.total_seconds(),
			'track': serialized_track
		}
	await consumer.group_send(consumer.group_name, event)

async def _send_round_stats(consumer: GlobalConsumer, serialized_stats: dict) -> None:
	"""Send final game stats to players at the end of a game."""
	serialized_game = GameHeaderSerializer(consumer.current_game).data
	serialized_track = TrackSerializer(consumer.current_game.current_track).data
	event = {'type': 'game_round_end',
			'game': serialized_game,
			'track': serialized_track,
			'results': serialized_stats,
			'message': 'Round ended',
			'is_last_round': (consumer.current_game.current_round
					 			>= consumer.current_game.num_tracks)}
	await consumer.group_send(consumer.group_name, event)

async def _send_game_stats(consumer: GlobalConsumer, serialized_stats: dict) -> None:
	"""Send final game stats to players at the end of a game."""
	serialized_game = GameHeaderSerializer(consumer.current_game).data
	await consumer.group_send(consumer.group_name, {
		'type': 'game_game_completed',
		'game': serialized_game,
		'leaderboard': serialized_stats
		})
