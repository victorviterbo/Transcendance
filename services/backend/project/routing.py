"""Channels WebSocket routes for room and global chat endpoints."""

#from re import re_path

from django.urls import path, re_path

from .consumers import GlobalConsumer, NotFoundConsumer

# websocket URL routes used by Channels' URLRouter.
# - ws/chat/<room_name>/  -> room-specific chat
# - ws/global/           -> Home/global chat (all connected Home clients)

websocket_urlpatterns = [
    path("ws/global/", GlobalConsumer.as_asgi()), # one and only websocket endpoint
    re_path(r'^.*$', NotFoundConsumer.as_asgi()), # 404
]
