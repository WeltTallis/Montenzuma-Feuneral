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

# Install ALL dependencies (devDependencies included; Vite needs them).
# A bounded V8 heap keeps the npm install from OOM-killing low-RAM build boxes.
ENV NODE_OPTIONS=--max-old-space-size=2048

# esbuild must be installed explicitly (vite@8 declares it as an *optional*
# peer dependency that npm does not auto-install) and PINNED to a version
# inside vite@8's peer range (^0.27.0 || ^0.28.0). The previous unpinned
# "npm install esbuild" could drift to a version outside that range.
RUN npm config set fetch-timeout 1200000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 120000 \
 && npm config set fetch-retry-maxtimeout 600000 \
 && npm install --legacy-peer-deps \
 && npm install --no-save esbuild@0.28.2 --legacy-peer-deps

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

    # Docker's embedded DNS. Declared so the /monitoring proxy_pass below can
    # resolve the gateway lazily at request time via a variable. A static
    # proxy_pass would make nginx refuse to START when the gateway container
    # is not up yet, taking the whole SPA down with it.
    resolver 127.0.0.11 valid=10s ipv6=off;

    # Infrastructure Monitor - GET /monitoring.
    # The dashboard polls the API gateway ROOT (/monitoring), NOT under
    # /api/v1/restpoint. CRITICAL: without this block /monitoring falls into
    # the SPA fallback below and returns index.html, so the dashboard throws
    #   Unexpected token '<', "<!DOCTYPE "... is not valid JSON
    # and every card renders blank behind a GATEWAY UNREACHABLE banner.
    # Exact match on purpose - it must not shadow the SPA route
    # /<slug>/monitoring, which is a different path and must stay HTML.
    location = /monitoring {
        set $restpoint_gateway "restpoint_api_gateway:5000";
        proxy_pass http://$restpoint_gateway/monitoring;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # The report probes every routed service (3s timeout each, bounded
        # concurrency) and reads Redis, so allow headroom.
        proxy_connect_timeout 10s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;
    }

                # SPA fallback: any route that is not a static file returns index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Scanner Bridge app download.
    # The zip ships as /downloads/restpoint-scanner-bridge-app.zip — serve it as a
    # binary download (force Content-Disposition so the browser downloads instead
    # of trying to render it, which is what caused the old "/downloads/..." link to
    # fall through the SPA fallback and return the home page).
    location ^~ /downloads/ {
        alias /usr/share/nginx/html/downloads/;
        autoindex off;
        types { }
        default_type application/zip;
        add_header Content-Disposition "attachment" always;
        add_header Cache-Control "public, max-age=86400" always;
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