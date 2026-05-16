"""URL routes for game API endpoints."""

from django.urls import path

from .views import FriendsGameView, GeneralGameView, SingleGameView

urlpatterns = [
    path('', GeneralGameView.as_view()),
    path('friends/', FriendsGameView.as_view()),
    path('<uuid:uid>/', SingleGameView)
]
