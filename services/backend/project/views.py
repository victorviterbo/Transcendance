"""Project-level utility views."""

from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """Return a cheap readiness response once Django is serving requests."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """Confirm that the backend HTTP stack is ready."""
        return Response({"status": "ok"})
