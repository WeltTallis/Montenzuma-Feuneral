#!/bin/sh
set -eu

compose_file=docker-compose.yml
mode=services

case $# in
  0)
    ;;
  1)
    case $1 in
      services|image-list|verify-dockerfiles) mode=$1 ;;
      *) compose_file=$1 ;;
    esac
    ;;
  2)
    compose_file=$1
    mode=$2
    ;;
  *)
    echo "Usage: sh scripts/list-build-services.sh [compose-file] [services|image-list|verify-dockerfiles]" >&2
    exit 2
    ;;
esac

case $mode in
  services|image-list|verify-dockerfiles)
    ;;
  *)
    echo "Unknown mode: $mode" >&2
    exit 2
    ;;
esac

if [ ! -f "$compose_file" ]; then
  echo "Compose file not found: $compose_file" >&2
  exit 1
fi

records=$(awk -v mode="$mode" '
  function clean(value) {
    sub(/^[[:space:]]+/, "", value)
    sub(/[[:space:]]+#.*/, "", value)
    sub(/[[:space:]]+$/, "", value)
    if (value ~ /^".*"$/ || value ~ /^'\''.*'\''$/) {
      value = substr(value, 2, length(value) - 2)
    }
    sub(/\r$/, "", value)
    return value
  }

  function emit() {
    if (service == "" || !has_build) return

    if (mode == "services") {
      print service
    } else if (mode == "image-list") {
      if (image == "") {
        printf "Service %s has a build section but no image name\n", service > "/dev/stderr"
        failed = 1
      } else {
        print image
      }
    } else {
      print service "\t" context "\t" dockerfile
    }
  }

  /^[[:space:]]*#/ || /^[[:space:]]*$/ { next }

  /^services:[[:space:]]*($|#)/ {
    in_services = 1
    next
  }

  /^[^[:space:]]/ {
    in_services = 0
    next
  }

  in_services && /^  [A-Za-z0-9_.-]+:[[:space:]]*($|#)/ {
    emit()
    service = $0
    sub(/^  /, "", service)
    sub(/:.*/, "", service)
    has_build = 0
    context = "."
    dockerfile = "Dockerfile"
    image = ""
    in_build = 0
    next
  }

  service != "" && /^    build:[[:space:]]*($|#)/ {
    has_build = 1
    in_build = 1
    next
  }

  service != "" && /^    build:[[:space:]]*[^#]/ {
    has_build = 1
    in_build = 0
    context = clean($0)
    sub(/^build:[[:space:]]*/, "", context)
    next
  }

  service != "" && /^    image:[[:space:]]*/ {
    image = clean($0)
    sub(/^image:[[:space:]]*/, "", image)
    next
  }

  service != "" && in_build && /^      context:[[:space:]]*/ {
    context = clean($0)
    sub(/^context:[[:space:]]*/, "", context)
    next
  }

  service != "" && in_build && /^      dockerfile:[[:space:]]*/ {
    dockerfile = clean($0)
    sub(/^dockerfile:[[:space:]]*/, "", dockerfile)
    next
  }

  END {
    emit()
    if (failed) exit 1
  }
' "$compose_file") || exit $?

if [ -z "$records" ]; then
  echo "No buildable services found in $compose_file" >&2
  exit 1
fi

if [ "$mode" != "verify-dockerfiles" ]; then
  printf '%s\n' "$records"
  exit 0
fi

failed=0
tab=$(printf '\t')
while IFS="$tab" read -r service context dockerfile; do
  case $context in
    /*) context_path=$context ;;
    *) context_path=$(dirname "$compose_file")/$context ;;
  esac
  case $dockerfile in
    /*) dockerfile_path=$dockerfile ;;
    *) dockerfile_path=$context_path/$dockerfile ;;
  esac

  if [ -f "$dockerfile_path" ]; then
    printf 'OK %s: %s\n' "$service" "$dockerfile_path"
  else
    printf 'Missing Dockerfile for %s: %s\n' "$service" "$dockerfile_path" >&2
    failed=1
  fi
done <<EOF
$records
EOF

exit "$failed"