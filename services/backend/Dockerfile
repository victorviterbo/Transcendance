FROM continuumio/miniconda3

WORKDIR /backend

COPY ./environment.yml .

RUN conda env create --file environment.yml

COPY . .

EXPOSE 8000

ENTRYPOINT ["conda", "run", "--no-capture-output", "-n", "backend", "python", "manage.py", "runserver", "0.0.0.0:8000"]
