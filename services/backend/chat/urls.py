"""HTTP URL patterns for chat room and direct-message endpoints."""

from django.urls import path

from .views import DirectMessageView, FriendMessageFeed, RoomView

urlpatterns = [
	path('direct/', DirectMessageView.as_view(), name='direct-room'),
	path('room/<uuid:room_uid>/', RoomView.as_view(), name='room'),
	path('message/', FriendMessageFeed.as_view(), name='friend-message-feed'),
]
