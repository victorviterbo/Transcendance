#!/bin/sh

set -eu

conda run -n backend python /backend/manage.py migrate
conda run -n backend python /backend/manage.py collectstatic --noinput

echo "Starting Production Server..."
exec conda run --no-capture-output -n backend daphne -b 0.0.0.0 -p 8000 project.asgi:application

exit 0
