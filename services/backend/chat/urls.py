"""HTTP URL patterns for chat room and direct-message endpoints."""

from django.urls import path

from .views import RoomView, DirectMessageView

urlpatterns = [
	path('direct/<int:user_id>/', DirectMessageView.as_view(), name='direct-room'),
	path('room/<int:pk>/', RoomView.as_view(), name='room')
]
