"""Define which objects can be traced from the admin pannel."""

from django.contrib import admin

from .models import SiteUser

admin.site.register(SiteUser)
