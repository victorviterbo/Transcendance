"""HTTP URL patterns for direct-message endpoints."""

from django.urls import path

from .views import DirectMessageView

urlpatterns = [
	path('direct/', DirectMessageView.as_view(), name='direct-room'),
]
