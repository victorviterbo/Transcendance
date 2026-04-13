"""Django app configuration for the friends application."""

from django.apps import AppConfig


class FriendsConfig(AppConfig):
    """Define linking of social module to the rest of the backend."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'friends'

    def ready(self) -> None:
        """Register friendship signals when the app starts."""
        from . import signals  # noqa: F401
