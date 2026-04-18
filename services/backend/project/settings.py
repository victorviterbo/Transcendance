"""Describes the settings used for the backend."""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# Use the .env to load env variables in Django
load_dotenv()

# Music provider settings, used for the music module
MUSIC_PROVIDER = os.getenv("MUSIC_PROVIDER", "itunes")


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# During dev, used to store user's media
MEDIA_ROOT = BASE_DIR / 'DB' / 'media'

MEDIA_URL = 'media/'

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'DB' / 'static'

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG') == 'True'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'backend']

# Definition of all installed modules
INSTALLED_APPS = [
	'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'corsheaders',
    'django_extensions',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',

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
    'corsheaders.middleware.CorsMiddleware',
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
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'userauth.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ]
}

SESSION_EXPIRE_AT_BROWSER_CLOSE = True

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=90),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'CHECK_REVOKE_TOKEN': True,
}

# Cross Origin Ressource Sharing (CORS) - One of the middlewares
# In this context, enables the Back to accept requests from the front
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost",
    "http://127.0.0.1",
    "http://0.0.0.0",
]

# Added for Channels: point ASGI application to channels routing(for chatroom)
ASGI_APPLICATION = 'project.asgi.application'

# Channels layer config (single-instance runtime, no Redis dependency).
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Database definition
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'DB/website/db.sqlite3',
    }
}

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
