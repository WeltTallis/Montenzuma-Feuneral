#!/bin/sh
# ===========================================================================
# List the compose services that declare a `build:` block.
#
# POSIX sh + awk ONLY — no Node.js. The production host runs Docker on a plain
# Debian VPS (`/bin/sh`, awk, grep, sed) with NO Node installed, so the Makefile
# must never shell out to `node` here. Doing so produced:
#     /bin/sh: 1: node: not found
#     make: *** [Makefile:454: validate] Error 127
#
# Usage:
#   sh scripts/list-build-services.sh                                 # names
#   sh scripts/list-build-services.sh docker-compose.prod.yml
#   sh scripts/list-build-services.sh docker-compose.prod.yml images      # "<svc>\t<image>"
#   sh scripts/list-build-services.sh docker-compose.prod.yml image-list  # "<image>"
#   sh scripts/list-build-services.sh docker-compose.prod.yml dockerfiles # "<Dockerfile path>"
#
# The list is DERIVED from the compose file rather than hand-maintained, because
# the old hardcoded list silently omitted florist-service and made `make prod-up`
# die with "No such image: restpoint-florist-service:latest".
#
# Exit codes:
#   0  services were printed (possibly none, if the compose file has no builds)
#   1  `docker compose config` failed, or it produced services but NONE with a
#      `build:` block — that means the YAML parsing broke, and silently
#      returning an empty list would make every build target a no-op that still
#      prints "✓ Build complete". Callers must treat this as fatal.
# ===========================================================================
set -eu

# Arguments may be given in any order; a known mode name is recognised as the
# mode, anything else is treated as the compose file. This avoids the footgun of
# `script.sh dockerfiles` being read as a compose file name.
COMPOSE_FILE=""
MODE="services"
for arg in "$@"; do
  case "${arg#--}" in
    services | images | image-list | dockerfiles) MODE="${arg#--}" ;;
    *) COMPOSE_FILE="${arg}" ;;
  esac
done

if [ -n "${COMPOSE_FILE}" ]; then
  CONFIG="$(docker compose -f "${COMPOSE_FILE}" config 2>/dev/null)" || {
    echo "list-build-services: 'docker compose -f ${COMPOSE_FILE} config' failed" >&2
    exit 1
  }
else
  CONFIG="$(docker compose config 2>/dev/null)" || {
    echo "list-build-services: 'docker compose config' failed" >&2
    exit 1
  }
fi

[ -n "${CONFIG}" ] || { echo "list-build-services: empty compose config" >&2; exit 1; }

# `docker compose config` emits expanded YAML with deterministic indentation:
#   services:                 <- column 0
#     <service>:              <- exactly 2 spaces
#       build:                <- exactly 4 spaces
#       image: <ref>          <- exactly 4 spaces
#
# Services are buffered and flushed when the NEXT service (or a following
# top-level key, or EOF) is reached — so a `build:` and a later `image:` are
# both captured before anything is printed. `emit()` resets its state, which
# prevents the last service being printed twice at EOF.
#
# Pulled images (mariadb/redis/rabbitmq) have no `build:` key, so they are
# excluded automatically rather than by a hardcoded name list.
RESULT="$(
  printf '%s\n' "${CONFIG}" | awk -v mode="${MODE}" '
    function emit() {
      if (svc != "" && has_build) {
        if (mode == "images")          print svc "\t" image;
        else if (mode == "image-list") { if (image != "") print image }
        else if (mode == "dockerfiles") {
          if (dockerfile != "") {
            ctx = (context == "" ? "." : context);
            print ctx "/" dockerfile;
          }
        }
        else                           print svc;
      }
      svc = ""; has_build = 0; image = ""; context = ""; dockerfile = "";
    }

    /^services:[[:space:]]*$/ { in_services = 1; next }

    # A following top-level key (volumes:, networks:, ...) ends the services map
    in_services && /^[^[:space:]]/ { emit(); in_services = 0; next }

    in_services && /^  [A-Za-z0-9._-]+:[[:space:]]*$/ {
      emit();                                  # flush the previous service
      svc = $1; sub(/:$/, "", svc); next
    }

    in_services && /^    build:/ { has_build = 1; next }

    # Both keys live inside the build: block, indented 6 spaces
    in_services && has_build && /^      context:/ {
      context = $2; gsub(/"/, "", context); next
    }
    in_services && has_build && /^      dockerfile:/ {
      dockerfile = $2; gsub(/"/, "", dockerfile); next
    }

    in_services && /^    image:/ {
      image = $2; gsub(/"/, "", image); next
    }

    END { emit() }
  '
)"

# Guard against a silent parse failure: if compose reported services but we
# extracted no buildable ones, something is wrong with the parsing above.
if [ -z "${RESULT}" ]; then
  TOTAL="$(docker compose ${COMPOSE_FILE:+-f "${COMPOSE_FILE}"} config --services 2>/dev/null | awk 'NF { n++ } END { print n + 0 }')" || TOTAL=0
  if [ "${TOTAL:-0}" -gt 0 ]; then
    echo "list-build-services: parsed 0 buildable services out of ${TOTAL} compose services — refusing to return an empty list" >&2
    exit 1
  fi
fi

if [ -n "${RESULT}" ]; then
  printf '%s\n' "${RESULT}"
fi
exit 0


