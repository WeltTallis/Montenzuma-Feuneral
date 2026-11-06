#!/bin/sh

set -u

health_url="http://127.0.0.1:${PORT:-5000}/health"
failure_file="/tmp/api-gateway-health-failures"

if wget -q --timeout=2 -O /dev/null "$health_url"; then
  rm -f "$failure_file"
  exit 0
fi

failures=0
if [ -r "$failure_file" ]; then
  read -r failures < "$failure_file" || failures=0
fi
case "$failures" in
  ''|*[!0-9]*) failures=0 ;;
esac
failures=$((failures + 1))
printf '%s\n' "$failures" > "$failure_file"
echo "API gateway liveness probe failed (${failures}/3)" >&2

# Docker marks a container unhealthy but does not restart it. After three
# consecutive local liveness failures, stop PID 1 so restart: always can recover it.
if [ "$failures" -ge 3 ]; then
  echo "API gateway failed three consecutive liveness probes; requesting restart" >&2
  kill -TERM 1 || true
fi

exit 1
