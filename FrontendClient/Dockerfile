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


RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'

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

    # ------------------------------------------------------------------
    # HARDENING: intentionally minimal.
    # ------------------------------------------------------------------
    # This block previously carried a deep-defence stack — a verb allowlist
    # (`if ($request_method !~ ^(GET|HEAD|POST|...)$) { return 405; }`), null-byte
    # and `..` path-traversal 400s, a dotfile 404, a scanner/exploit path blocklist
    # and a "never serve these extensions" 404. All of it has been REMOVED because
    # the verb allowlist broke the application outright:
    #
    #   POST https://restpoint.co.ke/api/v1/restpoint/auth/login  ->  405
    #
    # Any POST/PUT/PATCH that reached this container was rejected here, so login
    # (and every other write) failed before it could reach the app. The blocks were
    # also redundant: the container serves ONLY a static SPA from /usr/share/nginx/
    # html — there are no .env, .git, .sql or credential files in the image to
    # protect, and real input validation belongs in the services, not in a static
    # file server. `server_tokens off` is kept because it costs nothing.
    server_tokens off;

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

    # API traffic must NEVER fall through to the SPA fallback. A POST to a
    # non-existent path lands on `try_files ... /index.html`, and nginx cannot
    # serve a static file over POST — it answers 405. That is what broke login:
    #   POST /api/v1/restpoint/auth/login -> 405 Method Not Allowed
    # Proxying /api/ here means the request is forwarded to the gateway even if
    # the host reverse proxy sends it to this container (which it did — the
    # access log shows POSTs to /api/ arriving here from 172.18.0.1).
    #
    # `^~` so no regex location below can shadow it. The target goes through a
    # variable + `resolver` for the same reason as /monitoring and /socket.io/:
    # a static proxy_pass would stop nginx from starting whenever the gateway
    # container is not yet resolvable, taking the whole SPA down with it.
    location ^~ /api/ {
        set $restpoint_api "restpoint_api_gateway:5000";
        proxy_pass http://$restpoint_api;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 15 min, matching the host reverse proxy: org setup, PDF generation and
        # bulk uploads are slow but legitimate.
        proxy_connect_timeout 900s;
        proxy_send_timeout    900s;
        proxy_read_timeout    900s;
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

    # ------------------------------------------------------------------
    # /uploads/ — the ONE shared uploads folder (host /opt/storage/uploads,
    # mounted READ-ONLY into this container; see the `volumes:` block on
    # the `frontend` service in docker-compose.prod.yml).
    # ------------------------------------------------------------------
    # WHY THIS BLOCK IS REQUIRED: without it every /uploads/... request fell
    # through to the SPA fallback below and was answered with index.html,
    # which a browser renders as a broken <img> — signatures, tenant logos,
    # coffin images and PDFs silently "disappeared" even though the files
    # existed on the host. Previously they only worked because the HOST
    # reverse proxy had its own `location /uploads/` → tenant-service:5002
    # rule; anything that reached this container directly (portal subdomain,
    # a bare :8080 hit) got HTML where an image was expected.
    #
    # `^~` is LOAD-BEARING, not cosmetic. The static-asset regex
    # `~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff...)$` further down also
    # matches /uploads/<tenant>/images/coffin.png, and a regex location
    # beats a plain prefix one — so without `^~` that block would answer
    # 404 from the SPA document root (/usr/share/nginx/html) instead of
    # serving the mounted file. `^~` also stops regex evaluation entirely
    # for this prefix.
    #
    # `alias` (rather than root + rewrite) keeps the mount point in exactly
    # one place. `try_files` is deliberately NOT used alongside it: try_files
    # resolves $uri against `root`, not against `alias`, and mis-resolves —
    # nginx's own 404 for a missing file is both the correct answer here and
    # the trigger for the fallback below.
    location ^~ /uploads/ {
        alias /opt/storage/uploads/;

        # No directory listings — a tenant must never be able to enumerate
        # another tenant's uploads by walking the path.
        autoindex off;

        # Uploaded content is user-supplied, so never serve dotfiles out of
        # it (an upload named `.env` would otherwise be readable). The regex
        # only matches a dot IMMEDIATELY after a slash, so a legitimate name
        # like /uploads/acme.ltd/logo.png is unaffected. Returns 403, not
        # 404, so this refusal cannot be rewritten by the 404 fallback below.
        if ($uri ~ "(^|/)\.") { return 403; }

        # A `location`-level add_header REPLACES the inherited server-level
        # set, so the security headers are re-declared here rather than lost.
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Uploaded files are immutable once written, so cache them hard.
        # ACAO is required because <img>/PDF.js fetch these cross-origin
        # (e.g. from the portal subdomain) and a blocked read is a broken
        # image rather than a visible error.
        add_header Cache-Control "public, max-age=86400" always;
        add_header Access-Control-Allow-Origin "*" always;

        # Files in the shared folder are written by the backend containers as
        # uid 1001 while this worker runs as `nginx`, so a file that exists
        # but is not yet world-readable must not 404 for ever. Fall through to
        # the service that owns the same folder instead.
        error_page 404 = @uploads_via_tenant_service;
    }

    # Fallback for when the read-only mount is absent (image run without the
    # compose `volumes:` entry) or a file is unreadable: ask tenant-service,
    # which owns the canonical static mount of the same directory
    # (express.static(GLOBAL_UPLOADS_DIR) in services/tenant-service/server.ts).
    # Same variable + `resolver` form as /monitoring, /api/ and /socket.io/
    # above, so nginx still STARTS when the tenant-service container is down —
    # this block is only reached per request, and then fails that ONE file
    # instead of taking the whole SPA offline.
    location @uploads_via_tenant_service {
        set $restpoint_uploads "restpoint_tenant_service:5000";
        proxy_pass http://$restpoint_uploads;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;
    }

                # SPA fallback: any route that is not a static file returns index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
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