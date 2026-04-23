"""Channels WebSocket routes for room and global chat endpoints."""

from django.urls import path, re_path

from .consumers import GlobalConsumer, NotFoundConsumer

# websocket URL routes used by Channels' URLRouter.
# - ws/global/           -> global chat (all connected clients)
# - ws/*                 -> 404 for unrecognized endpoints

websocket_urlpatterns = [
    path("ws/global/", GlobalConsumer.as_asgi()),
    re_path(r'^.*$', NotFoundConsumer.as_asgi()), # 404
]
