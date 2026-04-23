from rest_framework import serializers

from .models import Playlist, Track

class BlindSerializer(serializers.ModelSerializer):
	"""Serialize a track without any identifying information."""

	class Meta:
		model = Track
		fields = [
			'preview_url',
		]

class TrackSerializer(serializers.ModelSerializer):
	"""Serialize a single music track."""

	class Meta:
		model = Track
		fields = [
			'itunes_id',
			'title',
			'artist',
			'kind',
			'preview_url',
			'artwork_url',
		]


class PlaylistTracksSerializer(serializers.ModelSerializer):
	"""Serialize a playlist with its attached tracks."""

	tracks = TrackSerializer(many=True, read_only=True)

	class Meta:
		model = Playlist
		fields = [
			'id',
			'name',
			'slug',
			'rss_url',
			'tracks',
		]