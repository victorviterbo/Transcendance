from rest_framework import serializers

from .models import Playlist, Track


class BlindSerializer(serializers.ModelSerializer):
	"""Serialize a track without any identifying information."""

	class Meta:
		"""Defines the metaclass for the BlindSerializer."""
		model = Track
		fields = [
			'preview_url',
		]

class TrackSerializer(serializers.ModelSerializer):
	"""Serialize a single music track."""

	class Meta:
		"""Defines the metaclass for the TrackSerializer."""
		model = Track
		fields = [
			'itunes_id',
			'title',
			'artist',
			'genre',
			'preview_url',
			'artwork_url',
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