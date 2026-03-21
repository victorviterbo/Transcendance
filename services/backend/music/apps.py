from django.apps import AppConfig


class MusicConfig(AppConfig):
    """Define linking of music module to the rest of the backend."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'music'
