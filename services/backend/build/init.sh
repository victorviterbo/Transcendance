#!/bin/sh

set -eu

mkdir -p /data/database /data/media

conda run -n backend python /app/manage.py migrate

echo "Starting Production Server..."
exec conda run --no-capture-output -n backend daphne -b 0.0.0.0 -p 8000 project.asgi:application

exit 0
