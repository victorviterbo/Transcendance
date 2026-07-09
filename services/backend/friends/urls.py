"""Define url rerouting to views for the user module."""

from chat.views import FriendMessageFeed
from django.urls import path

from .views import (
    FriendRemove,
    FriendRequestsRespond,
    FriendRequestsSeePend,
    FriendRequestsSend,
    FriendSearch,
    FriendSee,
    NotifRead,
    NotifSee,
)

urlpatterns = [
    path('friends/', FriendSee.as_view()),
    path('friends-search/', FriendSearch.as_view()),
    path('friends-request/', FriendRequestsSeePend.as_view()),
    path('friend-request/respond/', FriendRequestsRespond.as_view()),
    path('friend-request/send/', FriendRequestsSend.as_view()),
    path('friend/remove/', FriendRemove.as_view()),

    path('notifs/', NotifSee.as_view()),
    path('notifs/read/', NotifRead.as_view()),
    
    path('message/', FriendMessageFeed.as_view()),
]
