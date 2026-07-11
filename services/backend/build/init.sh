#!/bin/sh

set -eu

PYTHON=/opt/conda/envs/backend/bin/python
DAPHNE=/opt/conda/envs/backend/bin/daphne
CELERY=/opt/conda/envs/backend/bin/celery

mkdir -p /data/media

$PYTHON /app/manage.py migrate

echo "Starting Celery Worker..."
$CELERY -A project worker --loglevel=info &

echo "Starting Celery Beat..."
$CELERY -A project beat --loglevel=info &

echo "Starting Production Server..."
exec $DAPHNE -b 0.0.0.0 -p 8000 project.asgi:application
