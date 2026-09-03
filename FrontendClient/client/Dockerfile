# Stage 1: Dependencies
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# Install everything from package-lock.json. esbuild is installed explicitly
# and PINNED because vite@8 declares it as an *optional* peer dependency
# (peerOptional esbuild@^0.27.0 || ^0.28.0), so npm does not add it on its own.
# The previous "npm install esbuild@0.21.5 / vite@5.4.0" pins are what caused
# the ERESOLVE conflict against vite@8.2.0.
RUN npm config set fetch-timeout 1200000 && npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 120000 && npm config set fetch-retry-maxtimeout 600000 \
 && npm install --legacy-peer-deps \
 && npm install --no-save esbuild@0.28.2 --legacy-peer-deps


# Stage 2: Builder
FROM node:24-alpine AS builder

WORKDIR /app

# Copy everything from deps
COPY --from=deps /app ./

# Copy source code
COPY . .

# NOTE: do NOT run npm install again here. node_modules (including the pinned,
# vite-compatible esbuild) is already copied from the deps stage. The previous
# "npm install esbuild@0.21.5 && npm install vite@5.4.0" in this layer is what
# broke the build with ERESOLVE (vite@8.2.0 requires esbuild ^0.27.0 || ^0.28.0).

# Build the app
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Stage 3: Production
FROM nginx:alpine AS production

RUN apk add --no-cache certbot certbot-nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]