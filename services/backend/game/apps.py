"""Django app configuration for the game application."""

from django.apps import AppConfig


class GameConfig(AppConfig):
    """Define linking of game module to the rest of the backend."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'game'
