"""HTTP URL patterns for chat room and direct-message endpoints."""

from django.urls import path

from . import views

urlpatterns = [
	path('direct/<int:user_id>/', views.direct_room, name='direct-room'),
	path('direct/username/<str:username>/', views.direct_room_by_username, name='direct-room-by-username'),
	path('room/<int:pk>/', views.room, name='room'),
	path('room/<int:pk>', views.room),
]
