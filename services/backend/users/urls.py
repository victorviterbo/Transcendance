"""Define url rerouting to views for the user module."""

from django.urls import path

from .views import LoginView, LogoutView, ProfileView, RefreshTokenView, RegisterView

urlpatterns = [
    path('login/', LoginView.as_view(), name='user-login'),
    path('register/', RegisterView.as_view(), name='user-register'),
    path('profile/', ProfileView.as_view(), name="user-profile"),
    path('logout/', LogoutView.as_view(), name="user-logout"),
    path('refresh/', RefreshTokenView.as_view(), name="user-refresh-token"),
]
