# Coolify: set Build Pack = Dockerfile (most reliable for Quasar SPA)
# Ports Exposes = 80

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_APP_MODE=production
ARG VITE_USE_API=true
ARG VITE_ENGINE_URL=
ARG VITE_ENGINE_PUBLIC_URL=

ENV VITE_APP_MODE=$VITE_APP_MODE \
    VITE_USE_API=$VITE_USE_API \
    VITE_ENGINE_URL=$VITE_ENGINE_URL \
    VITE_ENGINE_PUBLIC_URL=$VITE_ENGINE_PUBLIC_URL

RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/spa /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
