from django.contrib import admin
from .models import SiteUser, Profile

admin.site.register(SiteUser)
admin.site.register(Profile)