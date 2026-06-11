#!/bin/sh

set -eu

mkdir -p /backend/DB/website


rm -f /backend/DB/website/db.sqlite3
find /backend -path "*/migrations/0*" -delete

conda run -n backend python /backend/manage.py makemigrations
conda run -n backend python /backend/manage.py migrate
conda run -n backend python /backend/manage.py collectstatic --noinput

if [ "$APP_MODE" = "test" ]; then
    echo "Running Tests..."
    exec conda run --no-capture-output -n backend python /backend/manage.py test
    exit 0
fi

conda run -n backend bash -c "python /backend/manage.py shell < /backend/seed.py"

echo "Starting Production Server..."
exec conda run --no-capture-output -n backend daphne -b 0.0.0.0 -p 8000 project.asgi:application

exit 0