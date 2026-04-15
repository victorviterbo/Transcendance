#!/bin/sh

set -eu

if conda env list | grep -q '^backend '; then
    conda env update --name backend --file /backend/build/environment.yml --prune
else
    conda env create --file /backend/build/environment.yml
fi

mkdir -p /backend/DB/website

rm -f /backend/DB/website/db.sqlite3
find /backend -path "*/migrations/0*" -delete

conda run -n backend python /backend/manage.py makemigrations
conda run -n backend python /backend/manage.py migrate
conda run -n backend python /backend/manage.py collectstatic --noinput

if [ "$APP_MODE" = "run" ]; then
    echo "Starting Production Server..."
    exec conda run --no-capture-output -n backend daphne -b 0.0.0.0 -p 8000 project.asgi:application
else
    echo "Running Tests..."
    exec conda run --no-capture-output -n backend python /backend/manage.py test
fi
