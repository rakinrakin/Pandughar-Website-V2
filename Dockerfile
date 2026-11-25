# Blocks Release build: compile the Vite site, then serve dist/ from nginx on port 8080
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY scripts ./scripts
RUN npm ci

COPY . .

# passed by Blocks Release (the environment name); this static site has no per-environment config
ARG ci_build=dev

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
