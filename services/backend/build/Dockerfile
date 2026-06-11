FROM continuumio/miniconda3

WORKDIR /backend

COPY ./environment.yml .

RUN conda env create -f environment.yml && \
    conda clean -afy

COPY init.sh .

EXPOSE 8000

RUN chmod +x init.sh

ENTRYPOINT ["bash", "/backend/build/init.sh"]