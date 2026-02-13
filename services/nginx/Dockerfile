FROM node:20-alpine AS build-frontend

WORKDIR /app

COPY frontend/ .

RUN npm install
RUN npm run build

FROM nginx:alpine

COPY nginx/deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build-frontend /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
