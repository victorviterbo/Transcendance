FROM node:20-alpine AS build-frontend

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json .
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM continuumio/miniconda3 AS build-backend-static

WORKDIR /app

ENV SECRET_KEY=build-only-static-secret

COPY backend/build/environment.yml /tmp/backend-environment.yml
RUN conda env create --file /tmp/backend-environment.yml && conda clean -afy

COPY backend/ /app

RUN conda run --no-capture-output -n backend python /app/manage.py collectstatic --noinput

FROM nginx:alpine

COPY nginx/deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/deploy/snippets/ /etc/nginx/snippets/

COPY --from=build-frontend /app/dist /usr/share/nginx/html
COPY --from=build-backend-static /app/static /usr/share/nginx/html/static

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
