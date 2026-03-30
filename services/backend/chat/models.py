"""Database models for chat rooms and persisted chat messages."""

import uuid

from django.db import models


class Room(models.Model):
	"""Represents either a public chat room or a private direct-message room."""

	name = models.CharField(max_length=100, unique=True)
	participants = models.ManyToManyField(
		'userprofile.Profile',
		related_name='chat_rooms',
		blank=True,
	)
	is_direct = models.BooleanField(default=False)
	direct_key = models.CharField(max_length=64, unique=True, null=True, blank=True)
	
	uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

	def __str__(self) -> None:
		"""Return the human-readable room name."""
		return self.name


class Message(models.Model):
	"""Stores a single chat message along with delivery and read state."""

	sender_profile = models.ForeignKey('userprofile.Profile', on_delete=models.CASCADE)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	body = models.TextField()
	delivered = models.BooleanField(default=False)
	seen = models.BooleanField(default=False)
	updated = models.DateTimeField(auto_now=True)
	created = models.DateTimeField(auto_now_add=True)
	
	uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

	class Meta:
		"""Define ordering of the messages in the DB."""
		ordering = ['-updated', '-created']

	def __str__(self) -> None:
		"""Return a short preview of the message body."""
		return f'{self.body[0:50]} from {self.sender_profile}'
