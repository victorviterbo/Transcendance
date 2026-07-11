"""Describes the settings used for the backend."""

import logging
import os
from datetime import timedelta
from pathlib import Path

from celery.schedules import crontab
from dotenv import load_dotenv


def get_env_bool(key: str, *, default: bool = False) -> bool:
    value = os.getenv(key)

    if value is None:
        logger.debug(f"{key} missing from environment - using default")
        return default

    return value.strip().lower() in {"true", "1"}

def get_env_list(key: str, *, default: list[str] | None = None) -> list[str]:
    value = os.getenv(key)

    if value is None:
        logger.debug(f"{key} missing from environment - using default")
        return default or []

    return [item.strip() for item in value.split(",") if item.strip()]

logger = logging.getLogger(__name__)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# Use the .env to load env variables in Django
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path('/data')

MEDIA_URL = '/media/'
MEDIA_ROOT = DATA_DIR / 'media'

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'
STATICFILES_DIRS = [
    ('default_avatars', BASE_DIR / 'default_avatars'),
]

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is required")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = get_env_bool('DEBUG', default=False)

# Host validation
ALLOWED_HOSTS = get_env_list('ALLOWED_HOSTS',
                             default=["localhost", "127.0.0.1", "backend"])


# Cross-Site Request Forgery (CSRF) middleware
CSRF_TRUSTED_ORIGINS = get_env_list('CSRF_TRUSTED_ORIGINS',
                                    default=['https://localhost'])

# Security middleware
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Cookie creation
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG

# Definition of all installed modules
INSTALLED_APPS = [
	'daphne',
	'project',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'django_extensions',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'game.apps.GameConfig',
    'music.apps.MusicConfig',
    'userauth.apps.UsersauthConfig',
    'userprofile.apps.UserprofileConfig',
    'friends.apps.FriendsConfig',
    'stats.apps.StatsConfig',
    'chat.apps.ChatConfig',

    'django_cleanup.apps.CleanupConfig',
]

# Definition of the middlewares (Layers between the backend and the WebServer)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'project.middleware.ProfileMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Definition of Django Rest Framework (drf) parameters, enable Django to communicate
# more efficiently with the React Frontend
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'userauth.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'EXCEPTION_HANDLER':
        'userauth.exceptions.custom_auth_exception_handler',
}

SESSION_EXPIRE_AT_BROWSER_CLOSE = True

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=90),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'CHECK_REVOKE_TOKEN': True,
}


# Database definition
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'transcendence'),
        'USER': os.getenv('POSTGRES_USER', 'transcendence'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),
        'HOST': os.getenv('POSTGRES_HOST', 'database'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}


CELERY_BEAT_SCHEDULE = {
    'reap-waiting-games-every-minute': {
        'task': 'game.tasks.reap_foresaken_waiting_games',
        'schedule': crontab(minute='*'),  # Runs every minute
    },
}

CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'

# Keep your ASGI setup
ASGI_APPLICATION = 'project.asgi.application'

# KEEP THIS: Point Channels to your Redis container

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            # "redis" matches the service name in your docker-compose.yml
            "hosts": [("redis", 6379)], 
        },
    },
}
# Added for Channels: point ASGI application to channels routing(for chatroom)
"""
ASGI_APPLICATION = 'project.asgi.application'

# Channels layer config (single-instance runtime, no Redis dependency).
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}
"""


# Define which data model is used for authentication
# https://docs.djangoproject.com/en/6.0/topics/auth/customizing/#:~:text=AUTH_USER_MODEL%20setting%20that%20references%20a%20custom%20model%3A
AUTH_USER_MODEL = 'userauth.SiteUser'

# Set Password module option
# https://docs.djangoproject.com/en/6.0/topics/auth/passwords/#module-django.contrib.auth.password_validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'project.validators.ComplexPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# File where are defined which url leads to which view
# https://docs.djangoproject.com/en/6.0/topics/http/urls/#:~:text=root%20URLconf%20module%20to%20use.%20Ordinarily%2C%20this%20is%20the
ROOT_URLCONF = 'project.urls'
WSGI_APPLICATION = 'project.wsgi.application'

LOGIN_URL = '/api/auth/login/'
# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field
# define how entries are indexed, CAN LEAD TO LOSS OF BACK COMPATIBILITY
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Enables rendering of endpoints with minimal UI for testing/development without going through the front
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Definitiopn of drf-spectacular params (OpenAPI, used for documentation only)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Transcendance',
    'DESCRIPTION': 'Detailed description of your API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SWAGGER_UI_DIST': 'SIDECAR',
    'SWAGGER_UI_FAVICON_HREF': 'SIDECAR',
    'REDOC_DIST': 'SIDECAR',
}
