# nginx hardening

Two different nginx instances are involved. They live in different places, so
they are fixed in different ways.

| What | Where the config lives | How to deploy |
|---|---|---|
| **Static SPA** (`restpoint.co.ke/*`) | `FrontendClient/Dockerfile` — a quoted heredoc that writes `/etc/nginx/conf.d/default.conf` inside the `nginx:alpine` image | `git pull && make build-frontend` (automatic) |
| **API edge** (`restpoint.co.ke/api/…`) | this directory, `restpoint-api.conf` | copy to the host manually — see below |

## `restpoint-api.conf` (API edge — install on the server)

```bash
scp nginx/restpoint-api.conf  <user>@<host>:/tmp/
ssh <user>@<host>
sudo cp /tmp/restpoint-api.conf /etc/nginx/conf.d/restpoint-api.conf
sudo nginx -t                 # MUST pass before you reload
sudo systemctl reload nginx
```

`/etc/nginx/conf.d/*.conf` is included from **inside** `http{}`, so the
`limit_req_zone` / `limit_conn_zone` / `map` directives at the top of the file
are legal there.

Before you install it, edit one thing:

```nginx
upstream restpoint_gateway {
    server 127.0.0.1:5000;      # <- confirm this is your gateway address
    keepalive 64;
}
```

If the file is ever loaded from **inside** the compose network instead of the
host, that address becomes `restpoint_api_gateway:5000`.

## What is blocked, and why

### Never served (static host)

`location /` used to be a bare `try_files $uri $uri/ /index.html`, so **any**
file in the document root was downloadable. Now:

- `/\.(?!well-known)` → 404. Covers `/.env`, `/.git/config`, `/.npmrc`,
  `/.DS_Store`. (`.well-known` is kept for ACME.)
- A deny-list of file types → 404: `map bak old orig save swp swo tmp temp log
  sql dump db sqlite env ini conf cfg yaml yml sh bash ps1 bat cmd git lock ts
  tsx jsx tar gz rar 7z zip bz2 xz`. Declared **before** the static-asset
  regex on purpose — nginx evaluates regex locations in file order, first match
  wins, so `/app.js.bak` cannot slip into the cached-asset branch.
  `.json`, `.html`, `.xml`, `.webmanifest` and `.ico` are deliberately *not*
  listed, because the SPA needs them.
- Known scanner probes (`wp-admin`, `xmlrpc.php`, `phpmyadmin`, `actuator`,
  `jmx-console`, `server-status`, …) → 404.
- `TRACE` / `TRACK` / `CONNECT` → 405 (cross-site tracing, tunnel smuggling).
- Null bytes (`%00`) and traversal (`..`, `%2e%2e`) → 400. The `..` test runs
  against `$uri` — the normalised, decoded **path** — so a legitimate
  `?redirect=../dashboard` is not caught.

### Never forwarded (API edge)

- SQLi / XSS / command-injection signatures → 400. Only **multi-token**,
  high-confidence patterns are listed (`union[\s+/]+select`,
  `information_schema`, `onerror\s*=`, `/etc/passwd`, …). A bare `select`,
  `update` or `script` is deliberately **not** blocked — the app has legitimate
  `?search=` and `?status=` parameters and would break.
- Rate limits: **30 req/s** (burst 50) generally, **1 req/s** (burst 5) for
  credential endpoints, **50 connections** per IP.
- `server_tokens off`, plus `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy` and `Cross-Domain-Policies`.

### Why the client IP matters

Cloudflare sits in front of nginx, so `$remote_addr` is Cloudflare's edge
address. Without resolving the real visitor first, **every visitor would share
a single rate-limit bucket**. The `map` block derives it from
`CF-Connecting-IP` → `X-Real-IP` → `$remote_addr`, and that same address is
forwarded as `X-Real-IP` so the gateway's own `express-rate-limit` keys each
person separately.

## What is NOT changed here

- Real authorisation. These rules reject obvious junk; they do not replace
  input validation or access control inside each service.
- TLS. This assumes Cloudflare terminates HTTPS; the block listens on :80.
  If nginx terminates TLS too, add the `listen 443 ssl` server and cert paths.
- Host-header checking — deliberately omitted, because internal traffic
  (compose health checks, container-to-container) uses hostnames that are not
  `restpoint.co.ke` and would be broken by a strict allow-list.
