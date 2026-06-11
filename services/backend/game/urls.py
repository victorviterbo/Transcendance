"""URL routes for game API endpoints."""

from django.urls import path

from .views import FriendsGameView, GeneralGameView, SingleGameView

urlpatterns = [
    path('', GeneralGameView.as_view()), # /api/game/ -> get (list all public), post -> create new (public/private/invite_only)
    path('friends/', FriendsGameView.as_view()), # /api/game/ -> get -> list all friends games
    path('<uuid:uid>/', SingleGameView.as_view()) # TODO : delete class
]
