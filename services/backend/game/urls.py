"""URL routes for game API endpoints."""

from django.urls import path

from .views import GameAccessView, GameCreateView

urlpatterns = [
    path('create', GameCreateView.as_view(), name='game-create'),
    path('<int:game_id>', GameAccessView.as_view(), name='game-access'),
]
