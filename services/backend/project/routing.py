"""Channels WebSocket routes for room and global chat endpoints."""

from django.urls import path, re_path

from chat.presence_consumers import PresenceConsumer
from .consumers import GlobalConsumer, NotFoundConsumer

# websocket URL routes used by Channels' URLRouter.
# - ws/presence/         -> presence tracking (online/offline status)
# - ws/global/           -> global chat (all connected clients)
# - ws/*                 -> 404 for unrecognized endpoints

websocket_urlpatterns = [
    path("ws/presence/", PresenceConsumer.as_asgi()),
    path("ws/global/", GlobalConsumer.as_asgi()),
    re_path(r'^.*$', NotFoundConsumer.as_asgi()), # 404
]