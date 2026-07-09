from rest_framework import serializers

from .models import Playlist, Track


class TrackSerializer(serializers.ModelSerializer):
	"""Serialize a single music track."""
	preview = serializers.URLField(source='preview_url')
	artwork = serializers.URLField(source='artwork_url')

	class Meta:
		"""Defines the metaclass for the TrackSerializer."""
		model = Track
		fields = [
			'title',
			'artist',
			'preview',
			'artwork',
		]


class PlaylistMiniSerializer(serializers.ModelSerializer):
	"""Serialize a playlist."""

	class Meta:
		"""Serialize a playlist with very minimal fields to be sent at game start."""
		model = Playlist
		fields = [
			'name',
			'uid',
		]

class PlaylistTracksSerializer(serializers.ModelSerializer):
	"""Serialize a playlist with its attached tracks."""

	tracks = TrackSerializer(many=True, read_only=True)

	class Meta:
		"""Defines the metaclass for the PlaylistTracksSerializer."""
		model = Playlist
		fields = [
			'id',
			'name',
			'rss_url',
			'tracks',
		]