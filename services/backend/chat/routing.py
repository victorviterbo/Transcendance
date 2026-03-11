from django.urls import path

from .consumers import ChatConsumer

# websocket URL routes used by Channels' URLRouter.
# - ws/chat/<room_name>/  -> room-specific chat
# - ws/global/           -> Home/global chat (all connected Home clients)
websocket_urlpatterns = [
    path("ws/chat/<str:room_name>/", ChatConsumer.as_asgi()),
    path("ws/global/", ChatConsumer.as_asgi()),
]

