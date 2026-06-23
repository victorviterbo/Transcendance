#!/bin/sh

set -eu

mkdir -p /backend/DB/website

conda run -n backend python /backend/manage.py migrate
conda run -n backend python /backend/manage.py collectstatic --noinput

conda run -n backend python /backend/manage.py seed_playlists
conda run -n backend python /backend/manage.py sync_playlists

if [ "$APP_MODE" = "test" ]; then
    echo "Running Tests..."
    exec conda run --no-capture-output -n backend python /backend/manage.py test
    exit 0
fi

echo "Starting Production Server..."
exec conda run --no-capture-output -n backend daphne -b 0.0.0.0 -p 8000 project.asgi:application

exit 0