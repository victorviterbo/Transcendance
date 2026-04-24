"""URL routes for game API endpoints."""

from django.urls import path
from .views import GameView

urlpatterns = [
    path('', GameView.as_view(), name='game'),
]
