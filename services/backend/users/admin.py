"""Define which objects can be traced from the admin pannel."""

from django.contrib import admin

from .models import Profile, SiteUser

admin.site.register(SiteUser)
admin.site.register(Profile)
