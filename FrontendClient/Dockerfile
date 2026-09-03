# ============================================================
# Multi-stage production build for the RestPoint React/Vite UI
# ------------------------------------------------------------
#   Stage 1 (builder) : installs deps + runs `npm run build` -> /app/dist
#   Stage 2 (serve)   : nginx:alpine serving the SPA on :80
#
# WHY THIS EXISTS: the previous image only *built* dist into an
# alpine container that idled on `tail -f /dev/null` and relied on a
# host nginx + shared volume to serve the files. In production that
# wiring was never present, so the UI "built but never served a file".
# This image now runs nginx itself and serves the built assets directly.
# ============================================================

# ---------- Stage 1: build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY client/package*.json ./

# Install ALL dependencies (devDependencies included; Vite/esbuild need them).
# A bounded V8 heap keeps the npm install from OOM-killing low-RAM build boxes.
ENV NODE_OPTIONS=--max-old-space-size=2048

RUN npm config set fetch-timeout 1200000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 120000 \
 && npm config set fetch-retry-maxtimeout 600000 \
 && npm install --legacy-peer-deps \
 && npm install esbuild --legacy-peer-deps

# Copy the source code and build the SPA into /app/dist
COPY client/ ./
RUN npm run build

# ---------- Stage 2: serve ----------
FROM nginx:alpine AS production

# Self-contained nginx server block (SPA routing + asset caching).
# Written at build time with a *quoted* heredoc so $uri / regexes are
# copied verbatim with no shell expansion. Placed as a plain `server`
# block because the nginx:alpine base already provides `events`/`http`
# context and includes /etc/nginx/conf.d/*.conf.
RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 80;
    server_name _;

    root  /usr/share/nginx/html;
    index index.html;

    # SPA fallback: any route that is not a static file returns index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long-lived cache for hashed/static assets (js/css/images/fonts)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
NGINX

# Drop the built assets into nginx's document root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]