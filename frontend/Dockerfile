# Stage 1: Build React App
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (better caching)
COPY package*.json ./

RUN npm install

# Copy full project (not just src)
COPY . .

# Build React app
RUN npm run build


# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy build output to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config (important for React routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
