"""HTTP URL patterns for chat room and direct-message endpoints."""

from django.urls import path

from .views import RoomView, DirectMessageView

urlpatterns = [
	path('direct/<int:user_uid>/', DirectMessageView.as_view(), name='direct-room'),
	path('room/<int:room_uid>/', RoomView.as_view(), name='room')
]
