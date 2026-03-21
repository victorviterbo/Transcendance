"""Define which objects can be traced from the admin pannel."""

from django.contrib import admin

from .models import GameRoundStats, UserGameStats, UserRoundStats

admin.site.register(GameRoundStats)
admin.site.register(UserGameStats)
admin.site.register(UserRoundStats)
