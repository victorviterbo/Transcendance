from django.urls import path

from .views import Playlist90sView


urlpatterns = [
    path('playlist/90s/', Playlist90sView.as_view(), name='playlist-90s'),
]