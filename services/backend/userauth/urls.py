"""Define url rerouting to views for the user module."""

from django.urls import path

from .views import (
    LoginView,
    LogoutView,
    RefreshTokenView,
    RegisterView,
)

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('register/', RegisterView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('refresh/', RefreshTokenView.as_view()),
]
