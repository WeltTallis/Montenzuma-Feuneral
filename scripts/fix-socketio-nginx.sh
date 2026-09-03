#!/bin/bash
# =============================================================================
# scripts/fix-socketio-nginx.sh — Fix Socket.IO nginx proxy configuration
#
# PROBLEM: Frontend gets "websocket error" because nginx serves the SPA's
#          index.html for /socket.io/ requests instead of proxying to the
#          socketio-service.
#
# ROOT CAUSE: The production server's nginx config either:
#   1. Is missing the location /socket.io/ block
#   2. Has location /socket.io/ placed AFTER location /
#   3. Hasn't been reloaded after config changes
#   4. Cloudflare is caching SPA responses for /socket.io/ paths
#
# USAGE: Run this on the production server (restpoint.co.ke)
# =============================================================================

set -euo pipefail

NGINX_CONF="/etc/nginx/sites-available/restpoint"
NGINX_ENABLED="/etc/nginx/sites-enabled/restpoint"

echo "=== Socket.IO Nginx Fix ==="
echo

# 1. Check if nginx config exists
if [ ! -f "$NGINX_CONF" ]; then
    echo "ERROR: Nginx config not found at $NGINX_CONF"
    echo "Please ensure the config file exists."
    exit 1
fi

# 2. Check if location /socket.io/ exists
if grep -q "location /socket.io/" "$NGINX_CONF"; then
    echo "✓ location /socket.io/ block found in config"
    
    # Check order: socket.io must come before location /
    SOCKET_LINE=$(grep -n "location /socket.io/" "$NGINX_CONF" | head -1 | cut -d: -f1)
    ROOT_LINE=$(grep -n "location / {" "$NGINX_CONF" | head -1 | cut -d: -f1)
    
    if [ "$SOCKET_LINE" -lt "$ROOT_LINE" ]; then
        echo "✓ location /socket.io/ (line $SOCKET_LINE) is BEFORE location / (line $ROOT_LINE)"
    else
        echo "✗ ERROR: location /socket.io/ (line $SOCKET_LINE) is AFTER location / (line $ROOT_LINE)"
        echo "  This causes /socket.io/ requests to be served by the SPA fallback."
        echo "  Fix: Move the location /socket.io/ block BEFORE location /"
        exit 1
    fi
    
    # Check proxy_pass port
    if grep -A5 "location /socket.io/" "$NGINX_CONF" | grep -q "proxy_pass http://127.0.0.1:5013"; then
        echo "✓ proxy_pass points to correct port 5013"
    else
        echo "⚠ WARNING: proxy_pass may not point to port 5013"
        echo "  Expected: proxy_pass http://127.0.0.1:5013;"
        echo "  Found:"
        grep -A5 "location /socket.io/" "$NGINX_CONF" | grep "proxy_pass"
    fi
else
    echo "✗ ERROR: location /socket.io/ block NOT FOUND in config"
    echo "  Add the following block BEFORE location /:"
    echo
    echo "    location /socket.io/ {"
    echo "        proxy_pass http://127.0.0.1:5013;"
    echo "        proxy_http_version 1.1;"
    echo "        proxy_buffering off;"
    echo "        proxy_set_header Upgrade \$http_upgrade;"
    echo "        proxy_set_header Connection \$connection_upgrade;"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_set_header X-Real-IP \$remote_addr;"
    echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "        proxy_set_header X-Forwarded-Proto https;"
    echo "        proxy_connect_timeout 7d;"
    echo "        proxy_send_timeout 7d;"
    echo "        proxy_read_timeout 7d;"
    echo "    }"
    exit 1
fi

# 3. Test nginx config
echo
echo "Testing nginx configuration..."
if nginx -t 2>&1; then
    echo "✓ Nginx config test passed"
else
    echo "✗ Nginx config test FAILED"
    nginx -t 2>&1
    exit 1
fi

# 4. Reload nginx
echo
echo "Reloading nginx..."
if systemctl reload nginx 2>&1; then
    echo "✓ Nginx reloaded successfully"
else
    echo "✗ Failed to reload nginx"
    exit 1
fi

# 5. Verify the fix
echo
echo "Verifying Socket.IO endpoint..."
sleep 2

POLLING_TEST=$(curl -s -o /dev/null -w "%{http_code}" "https://restpoint.co.ke/socket.io/?EIO=4&transport=polling")
if [ "$POLLING_TEST" = "200" ]; then
    BODY=$(curl -s "https://restpoint.co.ke/socket.io/?EIO=4&transport=polling" | head -c 50)
    if [[ "$BODY" == 0{* ]]; then
        echo "✓ Socket.IO polling endpoint returns correct handshake"
    else
        echo "⚠ WARNING: Got 200 but body doesn't look like Engine.IO handshake"
        echo "  Body: $BODY"
    fi
else
    echo "✗ Polling endpoint returned HTTP $POLLING_TEST"
fi

echo
echo "=== Fix complete ==="
echo
echo "If the issue persists, check:"
echo "  1. Cloudflare: Ensure 'WebSockets' is enabled in Network settings"
echo "  2. Cloudflare: Purge cache for /socket.io/* paths"
echo "  3. Docker: Ensure socketio-service container is running"
echo "     docker ps | grep socketio"
echo "  4. Docker: Check container logs"
echo "     docker logs --tail 50 restpoint_socketio_service"
