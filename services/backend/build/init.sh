conda env create --file /backend/build/environment.yml

if [ ! -d "/backend/DB/website" ]; then
    mkdir "/backend/DB/website"
fi

rm /backend/DB/website/db.sqlite3
find . -path "*/migrations/0*" -delete

conda run -n backend python /backend/manage.py makemigrations
conda run -n backend python /backend/manage.py migrate

if [ "$APP_MODE" = "run" ]; then
    echo "Starting Production Server..."
    exec conda run --no-capture-output -n backend daphne -b 0.0.0.0 -p 8000 project.asgi:application
else
    echo "Running Tests..."
    exec conda run --no-capture-output -n backend python /backend/manage.py test
fi
