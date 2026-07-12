"""Project-level utility views."""

from django.db import connection
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """Return a cheap readiness response once Django is serving requests."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """Confirm that Django and its database are ready."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return Response({"status": "ok"})
