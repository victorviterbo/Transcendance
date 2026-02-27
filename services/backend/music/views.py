from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .itunes_client import fetch_90s_tracks


class Playlist90sView(APIView):
    """Return a simple 90s playlist for the frontend."""

    # If you want only authenticated users, change to IsAuthenticated
    permission_classes = []  # AllowAny by default in global settings

    def get(self, request):
        tracks = fetch_90s_tracks(limit=20)
        data = {"tracks": tracks}
        return Response(data, status=status.HTTP_200_OK)
