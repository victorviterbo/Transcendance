"""Define url rerouting to views for the stats module."""

from django.urls import path

from .views import GlobalStatsView, HistoryView, LeaderboardView

urlpatterns = [
    path('global/', GlobalStatsView.as_view()),
    path('leaderboard/', LeaderboardView.as_view()),
    path('history/', HistoryView.as_view()),
]
