# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only required files
COPY package.json package-lock.json ./
RUN npm ci

# Copy only source code
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build


# Stage 2: Nginx
FROM nginx:alpine

# Copy only build output
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]