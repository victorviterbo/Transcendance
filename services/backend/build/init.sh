conda env create --file /backend/build/environment.yml

if [ ! -d "/backend/DB/website" ]; then
    mkdir "/backend/DB/website"
fi

conda run -n backend python /backend/manage.py makemigrations
conda run -n backend python /backend/manage.py migrate

if [ "$APP_MODE" = "run" ]; then
    echo "Starting Production Server..."
    conda run --no-capture-output -n backend python /backend/manage.py runserver 0.0.0.0:8000
else
    echo "Running Tests..."
    conda run --no-capture-output -n backend python /backend/manage.py test
fi
