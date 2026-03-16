"""Database models for chat rooms and persisted chat messages."""

from django.conf import settings
from django.db import models


class Room(models.Model):
	"""Represents either a public chat room or a private direct-message room."""

	name = models.CharField(max_length=100, unique=True)
	participants = models.ManyToManyField(
		settings.AUTH_USER_MODEL,
		related_name='chat_rooms',
		blank=True,
	)
	is_direct = models.BooleanField(default=False)
	direct_key = models.CharField(max_length=64, unique=True, null=True, blank=True)

	def __str__(self):
		"""Return the human-readable room name."""

		return self.name


class Message(models.Model):
	"""Stores a single chat message along with delivery and read state."""

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	body = models.TextField()
	delivered = models.BooleanField(default=False)
	seen = models.BooleanField(default=False)
	updated = models.DateTimeField(auto_now=True)
	created = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-updated', '-created']

	def __str__(self):
		"""Return a short preview of the message body."""

		return self.body[0:50]
