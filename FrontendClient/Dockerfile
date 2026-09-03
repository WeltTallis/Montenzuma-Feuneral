# Multi-stage build for React frontend
# Builds the app and outputs dist/ to a shared volume for host nginx to serve
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY client/package*.json ./

# Install ALL dependencies (including devDependencies)
RUN NODE_OPTIONS=--max-old-space-size=2048 npm install --legacy-peer-deps

# Install esbuild separately (required by Vite 8 for transpilation)
RUN NODE_OPTIONS=--max-old-space-size=2048 npm install esbuild --legacy-peer-deps

# Copy source code
COPY client/ .

# Build the React app into /app/dist
RUN npm run build

# Output stage — built static files live in /usr/share/frontend-dist
# Host nginx mounts this volume and serves the files directly.
FROM alpine:3.20

COPY --from=builder /app/dist /usr/share/frontend-dist

# Keep the container running (host nginx serves the files, not this container)
VOLUME /usr/share/frontend-dist

CMD ["sh", "-c", "echo 'Frontend built. Dist files available at /usr/share/frontend-dist'; tail -f /dev/null"]