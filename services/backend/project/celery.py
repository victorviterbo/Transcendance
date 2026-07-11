"""Define celery tasks for background work."""

import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

app = Celery('project')

# Load task modules from all registered Django apps.
# The namespace='CELERY' means all celery-related config keys in settings.py must start with 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# THIS is the magic line that watches for tasks.py files
app.autodiscover_tasks()