"""Define url rerouting to views for the user module."""

from django.urls import path

from .views import (
    FriendRequestsRespond,
    FriendRequestsSeePend,
    FriendRequestsSend,
    FriendSee,
)

urlpatterns = [
    path('friends/list/', FriendSee.as_view()),
    path('request/pend/', FriendRequestsSeePend.as_view()),
    path('request/respond/', FriendRequestsRespond.as_view()),
    path('request/send/', FriendRequestsSend.as_view()),
]
