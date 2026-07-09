#!/bin/sh

set -eu

PYTHON=/opt/conda/envs/backend/bin/python
DAPHNE=/opt/conda/envs/backend/bin/daphne

mkdir -p /data/database /data/media

$PYTHON /app/manage.py migrate

echo "Starting Production Server..."
exec $DAPHNE -b 0.0.0.0 -p 8000 project.asgi:application
