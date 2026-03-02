"""Define url rerouting to views for the user module."""

from django.urls import path

from .views import ProfileView, UserSearchView, ProfileSearchView

urlpatterns = [
    path('', ProfileView.as_view(), name="user-profile"),
]
