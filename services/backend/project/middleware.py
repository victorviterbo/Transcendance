"""Attach the profile to every client on the site."""

import uuid

from django.http import HttpRequest, HttpResponse
from userprofile.models import Profile


class ProfileMiddleware:
    """Extra layer before execution of the request."""

    def __init__(self, get_response: callable) -> None:
        """Define construction of the middleware class."""
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Define procedure to be performed prior to treatment of request."""
        request.profile = None
        if request.user and request.user.is_authenticated:
            request.profile = getattr(request.user, 'profile', None)
        else:
            guest_uid = request.session.get('guest_profile_uid')
            if guest_uid:
                request.profile = Profile.objects.filter(uid=guest_uid).first()
        if not request.profile:
            guest_username = f"Guest_{uuid.uuid4().hex[:6]}"
            request.profile = Profile.objects.create(
                username=guest_username,
                is_guest=True
            )
            request.session['guest_profile_uid'] = str(request.profile.uid)
            request.session.modified = True
        return self.get_response(request)
