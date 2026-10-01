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
# WebSocket upgrade header map — REQUIRED for Socket.IO's WebSocket transport.
# "upgrade" is sent for WS requests, "close" for plain HTTP (Socket.IO polling).
# The nginx:alpine base includes /etc/nginx/conf.d/*.conf from inside http{}, so
# the map is legal here at the TOP of the file — NOT inside the server block.
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

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

    # ── Request hardening ────────────────────────────────────────────────
    # Everything below is answered by nginx itself: it never reaches the SPA
    # fallback, never reaches a file, and never reaches the app. These are
    # DEEP-DEFENCE rules — they stop the noisy, obviously-malicious traffic,
    # they are not a replacement for validating input inside each service.
    server_tokens off;

    # Only the verbs the SPA and the API actually use. TRACE/TRACK/CONNECT are
    # used for cross-site tracing (XST) and tunnel smuggling.
    if ($request_method !~ ^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$) {
        return 405;
    }

    # A null byte or a ".." segment has no legitimate use here and is the raw
    # material for path traversal and file smuggling.
    # The ".." test runs against $uri (the NORMALISED, decoded path with no
    # query string) so a legitimate `?redirect=../dashboard` is not caught,
    # while the encoded forms are tested on the raw $request_uri.
    if ($request_uri ~* "%00")  { return 400; }
    if ($uri       ~* "%00")  { return 400; }
    if ($uri       ~* "(^|/)\.\.(/|$)") { return 400; }
    if ($request_uri ~* "%2e%2e")    { return 400; }

    # Dotfiles and VCS metadata. `(?!well-known)` keeps ACME / .well-known
    # working. This is what used to be served straight out of the doc root by
    # the `try_files $uri` in the SPA fallback below.
    # `return 404` (not `deny`, which would answer 403) — a 403 tells a scanner
    # the resource exists and just needs credentials.
    location ~ /\.(?!well-known) {
        return 404;
        access_log off;
        log_not_found off;
    }

    # Known scanner / exploit probes. Answered 404 so the bot gets nothing.
    # `/metrics` is deliberately NOT here: the monitoring stack scrapes it and
    # the gateway's real endpoint is /monitoring (exact-matched below).
    location ~* ^/(?:wp-admin|wp-login|wp-content|wp-includes|xmlrpc\.php|xmlrpc|administrator|phpmyadmin|phpMyAdmin|adminer|pma|actuator|actuator/health|actuator/env|console|manager/html|jmx-console|solr|jenkins|gitlab|gitea|server-status|server-info|stub_status|nginx-status)(/|$) {
        return 404;
    }

    # ── Never serve these file types ─────────────────────────────────────
    # Declared BEFORE the static-asset regex further down on purpose: nginx
    # evaluates regex locations in file order, first match wins. That keeps
    # `/app.js.bak` and `/index.html.map` out of the cached-asset branch.
    # `.json`, `.html`, `.xml`, `.webmanifest` and `.ico` are deliberately NOT
    # listed — the SPA needs them (manifest.json, receipt.html, sw.js ...).
    location ~* \.(?:map|bak|old|orig|save|swp|swo|tmp|temp|log|sql|dump|db|sqlite3?|env|ini|conf|cfg|yaml|yml|sh|bash|zsh|ps1|bat|cmd|git|lock|ts|tsx|jsx|sql\.gz|tar|gz|rar|7z|zip|bz2|xz)$ {
        return 404;
        access_log off;
        log_not_found off;
    }

    # Ceilings. 50m matches the gateway's `express.json({ limit: '50mb' })`
    # so an upload rejected by the body parser is not rejected here first;
    # 16k of header space is far more than any real request needs and stops
    # header-stuffing. Timeouts stop a slow-loris style hold.
    client_max_body_size       50m;
    client_body_buffer_size  256k;
    client_header_timeout     15s;
    client_body_timeout       30s;
    send_timeout              30s;
    keepalive_timeout        65s;
    large_client_header_buffers 4 16k;
    reset_timedout_connection  on;

    # `nosniff` stops a served file from being re-interpreted as another type
    # (the classic .txt→HTML trick). `Referrer-Policy` keeps tenant slugs out
    # of outbound Referer headers.
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Permitted-Cross-Domain-Policies "none" always;

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

    # Socket.IO — WebSocket + long-polling, proxied to the socketio-service
    # container over the compose network. It MUST come before the SPA fallback
    # below, otherwise every handshake falls through to `try_files` and is
    # answered with index.html, which the browser reports as a websocket error.
    # `^~` so no regex location (the static-asset one especially) can shadow it.
    # The target goes through a variable for the same reason as /monitoring:
    # a static proxy_pass would make nginx refuse to START while the socketio
    # container is down, taking the entire SPA with it.
    location ^~ /socket.io/ {
        set $restpoint_socketio "restpoint_socketio_service:5000";
        proxy_pass http://$restpoint_socketio;
        proxy_http_version 1.1;
        proxy_buffering off;

        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        # WebSocket connections are long-lived and idle between frames.
        proxy_connect_timeout 60s;
        proxy_send_timeout    7d;
        proxy_read_timeout    7d;
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
        # A `location`-level add_header REPLACES the inherited server-level set,
        # so re-declare nosniff here or downloads lose it.
        add_header X-Content-Type-Options "nosniff" always;
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

# busybox wget, NOT GNU wget. `nginx:alpine` has no `wget` package installed, so
# `wget` here is busybox's, whose option set is:
#     [-cqS] [--spider] [-O FILE] [-o LOGFILE] [--header STR] ... [-T SEC]
# It has NO `--no-verbose` and NO `--tries`, so the previous
#     wget --no-verbose --tries=1 --spider http://localhost/
# exited non-zero with "unrecognized option" on every probe. The SPA was serving
# perfectly the whole time (real traffic in the access log) while Docker marked
# the container `unhealthy` — purely a broken probe. `-q -O /dev/null` are both
# supported by busybox and do a real GET, exiting 0 only on a 200.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]