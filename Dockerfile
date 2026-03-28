# Root Dockerfile targeting the Frontend subfolder
FROM node:20-alpine AS builder
WORKDIR /app
# Copy package files from the subfolder
COPY Frontend/package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts
# Copy the rest of the frontend source
COPY Frontend/ ./
RUN npm run build

FROM nginx:alpine
# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy nginx config from the subfolder
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod -R 755 /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
