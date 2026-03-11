"""Define url rerouting to views for the user module."""

from django.urls import path

from .views import (
    GuestCleanupView,
    GuestProfileCreateView,
    ProfileSearchView,
    ProfileView,
)

urlpatterns = [
    path('', ProfileView.as_view(), name="user-profile"),
    path('search/', ProfileSearchView.as_view(), name="profile-search"),
    path('guest-create/', GuestProfileCreateView.as_view(), name="profile-search"),
    path('guest-delete/', GuestCleanupView.as_view(), name="profile-search"),
]
