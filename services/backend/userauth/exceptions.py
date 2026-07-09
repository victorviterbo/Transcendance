"""Handle specific outadated login failure cases."""

from django.contrib.auth import logout
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_auth_exception_handler(exc: Exception, context: dict) -> Response | None:
    """Call DRF's standard exception handler first to get the standard error response."""
    response = exception_handler(exc, context)
    request = context.get('request')
    if response is not None and getattr(exc, 'detail', None):
        exc_code = getattr(exc.detail, 'code', None)
        if exc_code == "AUTHENTICATION_OUTDATED":
            if request:
                logout(request)
            response.delete_cookie('refresh-token')
    return response