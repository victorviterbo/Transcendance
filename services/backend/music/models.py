"""Define models for tracks and playlist."""
import uuid

from django.db import models


class Playlist(models.Model):
	"""Stores the different playlists (e.g., Rock, Rap, Classics)."""
	name = models.CharField(max_length=255, unique=True)
	rss_url = models.URLField(max_length=500, default='')
	uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

	def __str__(self) -> str:
		"""Define Playlist format for printing."""
		return self.name

class Track(models.Model):
	"""Stores the music tracks."""
	# Using the iTunes trackId to ensures we never save the same song twice
	itunes_id = models.IntegerField(unique=True, primary_key=True) 
	title = models.CharField(max_length=255)
	artist = models.CharField(max_length=255)
	genre = models.CharField(max_length=100, null=True, blank=True)
	
	# URLs can sometimes exceed 200 characters, so increasing max_length is safe
	preview_url = models.URLField(max_length=500, null=True, blank=True)
	artwork_url = models.URLField(max_length=500, null=True, blank=True)
		# This links the track to the playlist(s)
	playlists = models.ManyToManyField(Playlist, related_name='tracks')

	def __str__(self) -> str:
		"""Define Track format for printing."""
		return f"{self.title} by {self.artist}"
