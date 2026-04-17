"""Define url rerouting to views for the user module."""

from django.urls import path

from .views import (
    FriendRequestsRespond,
    FriendRequestsSeePend,
    FriendRequestsSend,
    FriendSearch,
    FriendSee,
    NotifRead,
    NotifSee,
)

urlpatterns = [
    #check with kris which url work and keep one of it
    path('friends', FriendSee.as_view()),
    path('friends/', FriendSee.as_view()),
    path('friends-search', FriendSearch.as_view()),
    path('friends-search/', FriendSearch.as_view()),
    path('friends-request', FriendRequestsSeePend.as_view()),
    path('friends-request/', FriendRequestsSeePend.as_view()),
    path('friend-request/respond', FriendRequestsRespond.as_view()),
    path('friend-request/respond/', FriendRequestsRespond.as_view()),
    path('friend-request/send', FriendRequestsSend.as_view()),
    path('friend-request/send/', FriendRequestsSend.as_view()),

    path('notifs', NotifSee.as_view()),
    path('notifs/', NotifSee.as_view()),
    path('notifs_read', NotifRead.as_view()),
    path('notifs_read/', NotifRead.as_view()),

    #check if we still need those url
    path('friends/list/', FriendSee.as_view()),
    path('request/pend/', FriendRequestsSeePend.as_view()),
    path('request/respond/', FriendRequestsRespond.as_view()),
    path('request/send/', FriendRequestsSend.as_view()),
]
