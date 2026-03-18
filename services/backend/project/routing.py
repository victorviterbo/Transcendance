"""Channels WebSocket routes for room and global chat endpoints."""

from django.urls import path

from .consumers import GlobalConsumer

# websocket URL routes used by Channels' URLRouter.
# - ws/chat/<room_name>/  -> room-specific chat
# - ws/global/           -> Home/global chat (all connected Home clients)

websocket_urlpatterns = [
    path("ws/global/", GlobalConsumer.as_asgi()),
]
