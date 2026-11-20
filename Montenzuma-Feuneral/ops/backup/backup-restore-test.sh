#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/verify-r2-backup.sh"
echo "[restore-test] PASS: remote backup is readable and structurally restorable"
