"""Define url rerouting to views for the user module."""

from django.urls import path

from .views import (
    FriendRequestsRespond,
    FriendRequestsSee,
    FriendRequestsSend,
    LoginView,
    LogoutView,
    RefreshTokenView,
    RegisterView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='user-login'),
    path('register/', RegisterView.as_view(), name='user-register'),
    path('logout/', LogoutView.as_view(), name="user-logout"),
    path('refresh/', RefreshTokenView.as_view(), name="user-refresh-token"),
    path('friend-request/', FriendRequestsSee.as_view(), name="friend-see"),
    path('friend-request/respond/', FriendRequestsRespond.as_view(), name="friend-respond"),
    path('friend-request/send/', FriendRequestsSend.as_view(), name="friend-send"),
]
