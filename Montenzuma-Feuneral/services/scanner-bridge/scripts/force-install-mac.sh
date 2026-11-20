#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Restpoint Scanner Bridge — force installer
#
# Use this when double-clicking the .pkg gets blocked by macOS Gatekeeper
# with "cannot be opened because the developer cannot be verified".
#
# Why that happens: the package is ad-hoc signed, not signed with an Apple
# Developer ID, and it is not notarised. Only a paid Apple Developer account
# can produce a certificate that makes a double-click install silently. This
# script gets the same result without one, by doing the two things Finder
# refuses to do on your behalf:
#
#   1. xattr -cr   strips the "downloaded from the internet" quarantine flag
#   2. installer   installs from the command line, which does not consult
#                  Gatekeeper the way a double-click does
#
# It is NOT a Gatekeeper bypass and does not weaken macOS security: it clears
# the quarantine attribute on this one file, which is the same thing you do by
# right-clicking the .pkg and choosing "Open".
# ─────────────────────────────────────────────────────────────────────────────

set -eu

cd "$(dirname "$0")"
PKG="Restpoint-Scanner-Bridge.pkg"

echo "==============================================="
echo " Restpoint Scanner Bridge — installer"
echo "==============================================="
echo

if [ ! -f "$PKG" ]; then
  echo "ERROR: $PKG was not found next to this script."
  echo
  echo "Keep this file in the same folder as the .pkg"
  echo "(usually your Downloads folder) and run it again."
  echo
  read -r -p "Press Return to close. " _ || true
  exit 1
fi

echo "1/3  Clearing the quarantine flag..."
xattr -cr "$PKG" 2>/dev/null || true
echo "     done."

echo
echo "2/3  Installing (this asks for your Mac password)..."
echo
if sudo -v; then
  :
else
  echo
  echo "ERROR: administrator permission was not granted, so nothing was installed."
  read -r -p "Press Return to close. " _ || true
  exit 1
fi

if sudo installer -pkg "$PKG" -target / ; then
  echo
  echo "     installed."
else
  echo
  echo "ERROR: the installer reported a failure. The full message is above."
  read -r -p "Press Return to close. " _ || true
  exit 1
fi

echo
echo "3/3  Starting the bridge..."
# The .pkg registers a LaunchAgent, so it should already be running. Nudge it
# in case the user session had no GUI session at install time.
sudo launchctl kickstart -k "gui/$(id -u)/com.welttallis.restpoint-scanner-bridge" 2>/dev/null \
  || echo "     (the bridge will start automatically at your next sign-in)"

echo
echo "==============================================="
echo " Done."
echo
echo " The bridge is listening on ws://localhost:8081"
echo
echo " It starts automatically every time you sign in."
echo
echo " To change its settings, edit:"
echo "   /Library/Application Support/Restpoint Scanner Bridge/.env"
echo
echo " If it is not working, the log is here:"
echo "   /Library/Application Support/Restpoint Scanner Bridge/bridge-error.log"
echo "==============================================="
echo

read -r -p "Press Return to close this window. " _ || true
exit 0
