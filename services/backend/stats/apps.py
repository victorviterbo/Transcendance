"""Django app configuration for the statistics application."""

from django.apps import AppConfig


class StatsConfig(AppConfig):
    """Define linking of statistics module to the rest of the backend."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'stats'
