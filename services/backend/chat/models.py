from django.conf import settings
from django.db import models


class Room(models.Model):
	name = models.CharField(max_length=100, unique=True)
	participants = models.ManyToManyField(
		settings.AUTH_USER_MODEL,
		related_name='chat_rooms',
		blank=True,
	)

	def __str__(self):
		return self.name


class Message(models.Model):
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
		return self.body[0:50]
