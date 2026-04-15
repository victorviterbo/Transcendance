"""URL routes for game API endpoints."""

from django.urls import path
from .views import GameTestView

urlpatterns = [
    path('test/', GameTestView.as_view(), name='game-test'),
]
