"""Links the user module to the rest of the backend."""

from django.apps import AppConfig


class UsersConfig(AppConfig):
    """Define linking of user module to the rest of the backend."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self) -> None:
        """Activate the signals of the user module."""
        import users.signals
