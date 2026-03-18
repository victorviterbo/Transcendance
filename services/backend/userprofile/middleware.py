"""Attach the profile to every client on the site."""
import uuid

from userprofile.models import Profile


class ProfileMiddleware:
    """Extra layer before execution of the request."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.profile = None
        if request.user.is_authenticated:
            request.profile = getattr(request.user, 'profile', None)
        else:
            guest_id = request.session.get('guest_profile_id')
            if guest_id:
                request.profile = Profile.objects.filter(id=guest_id, is_guest=True).first()
        if not request.profile:
            guest_username = f"Guest_{uuid.uuid4().hex[:6]}"
            request.profile = Profile.objects.create(
                username=guest_username,
                is_guest=True
            )
            request.session['guest_profile_id'] = request.profile.id
            request.session.modified = True

        
        return self.get_response(request)