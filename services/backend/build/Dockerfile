FROM continuumio/miniconda3

EXPOSE 8000

WORKDIR /backend

COPY build/environment.yml /tmp/backend-environment.yml
RUN conda env create --file /tmp/backend-environment.yml && conda clean -afy


COPY build/init.sh /usr/local/bin/backend-init.sh
RUN chmod +x /usr/local/bin/backend-init.sh

COPY . /backend

ENTRYPOINT ["bash", "/usr/local/bin/backend-init.sh"]
