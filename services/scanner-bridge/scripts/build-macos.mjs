import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const workspaceRoot = path.resolve(root, '..', '..');

/**
 * Locate the `pkg` executable.
 *
 * This used to hardcode `<workspaceRoot>/node_modules/.bin/pkg`, which only
 * works if npm happened to hoist it there. In this monorepo `pkg` is a
 * devDependency of services/scanner-bridge, and when it is not hoisted the
 * build died with:
 *     'D:\new\restpoint\node_modules\.bin\pkg.cmd' is not recognized...
 * which reads like a broken script rather than a missing dependency, and took
 * the macOS CI build down with it. Check the plausible locations in order and
 * say exactly what to run if it is genuinely absent.
 */
function resolvePkgCommand() {
  const binName = process.platform === 'win32' ? 'pkg.cmd' : 'pkg';
  const candidates = [
    path.join(root, 'node_modules', '.bin', binName),
    path.join(workspaceRoot, 'node_modules', '.bin', binName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  console.error(
    `\n[mac] BUILD FAILED: the "pkg" compiler is not installed.\n` +
    `      Looked in:\n        ${candidates.join('\n        ')}\n\n` +
    `      Fix by installing it:\n        npm install --legacy-peer-deps\n`
  );
  process.exit(1);
}

const pkgCommand = resolvePkgCommand();
const outputDir = path.join(root, 'dist', 'macos-package');
const payloadDir = path.join(outputDir, 'payload');
const scriptsDir = path.join(outputDir, 'scripts');
const forceInstallHelper = path.join(root, 'scripts', 'force-install-mac.sh');
const agentSourcePath = path.join(outputDir, 'Restpoint-Scanner-Bridge');
const pkgPath = path.join(root, 'dist', 'Restpoint-Scanner-Bridge.pkg');
const packageTargets = process.platform === 'darwin' && process.arch === 'arm64'
  ? 'node18-macos-arm64'
  : 'node18-macos-x64';
const publicMacDirs = [
  path.join(workspaceRoot, 'FrontendClient', 'client', 'public', 'downloads', 'macbook'),
  path.join(workspaceRoot, 'public', 'downloads', 'macbook'),
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

function copyPkgToPublic() {
  for (const dir of publicMacDirs) {
    fs.mkdirSync(dir, { recursive: true });
    const targetPath = path.join(dir, 'Restpoint-Scanner-Bridge.pkg');
    fs.copyFileSync(pkgPath, targetPath);
    console.log(`[mac] copied to ${targetPath}`);
  }
}

const postinstall = `#!/bin/bash
set -eu

INSTALL_DIR="/Library/Application Support/Restpoint Scanner Bridge"
AGENT_PATH="$INSTALL_DIR/Restpoint Scanner Bridge"
CONFIG_PATH="$INSTALL_DIR/.env"
PLIST_PATH="/Library/LaunchAgents/com.welttallis.restpoint-scanner-bridge.plist"

# The .pkg payload already places the binary at $AGENT_PATH, so there is nothing
# to copy. The previous script ran:
#     cp "$AGENT_PATH" "$AGENT_PATH"
# which is a no-op that cp reports as "are identical file"; under \`set -e\` that
# non-zero exit aborted the whole install.
if [ ! -f "$AGENT_PATH" ]; then
  echo "postinstall: expected the bridge binary at $AGENT_PATH but it is missing." >&2
  exit 1
fi
chmod 755 "$AGENT_PATH"

# First-run config. The agent reads $INSTALL_DIR/.env (it searches the folder it
# lives in), so this is where an admin changes the cloud address or ports
# without reinstalling. Only written once - never clobber local edits.
if [ ! -f "$CONFIG_PATH" ]; then
  cat > "$CONFIG_PATH" <<ENVEOF
# Restpoint Scanner Bridge - local configuration
# Edit and restart the bridge (it starts automatically at sign-in).

# The Restpoint cloud the bridge checks scan grants against.
BRIDGE_CLOUD_URL=https://restpoint.co.ke

# Which web front-ends may connect to this bridge.
BRIDGE_ALLOWED_ORIGINS=https://restpoint.co.ke,https://www.restpoint.co.ke

BRIDGE_HOST=127.0.0.1
BRIDGE_PORT=8081
ENVEOF
  chmod 644 "$CONFIG_PATH"
fi

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.welttallis.restpoint-scanner-bridge</string>
  <key>ProgramArguments</key><array><string>$AGENT_PATH</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$INSTALL_DIR/bridge.log</string>
  <key>StandardErrorPath</key><string>$INSTALL_DIR/bridge-error.log</string>
</dict></plist>
PLIST

launchctl bootout gui/$(id -u) "$PLIST_PATH" 2>/dev/null || true
launchctl bootstrap gui/$(id -u) "$PLIST_PATH"
launchctl kickstart -k gui/$(id -u)/com.welttallis.restpoint-scanner-bridge

echo "Restpoint Scanner Bridge installed and running on ws://localhost:8081."
printf '%s\n' "The bridge starts automatically when you sign in."
`;

const readme = `Restpoint Scanner Bridge for macOS

1. Download the .pkg installer and double-click it.
2. Allow the installer to complete the system prompt.
3. The bridge runs in the background and listens on ws://localhost:8081.

This package installs the bridge under /Library/Application Support and registers a LaunchAgent.
`;

console.log('[mac] building pkg installer bundle...');
run(npmCommand, ['run', 'build']);
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(path.join(payloadDir, 'Library', 'Application Support', 'Restpoint Scanner Bridge'), { recursive: true });
fs.mkdirSync(scriptsDir, { recursive: true });

console.log(`[mac] compiling ${packageTargets} macOS executable...`);
run(pkgCommand, ['dist/agent.js', '--targets', packageTargets, '--output', agentSourcePath, '--compress', 'GZip']);

const installedBinaryPath = path.join(payloadDir, 'Library', 'Application Support', 'Restpoint Scanner Bridge', 'Restpoint Scanner Bridge');
fs.copyFileSync(agentSourcePath, installedBinaryPath);
fs.chmodSync(installedBinaryPath, 0o755);

fs.writeFileSync(path.join(scriptsDir, 'postinstall'), postinstall, { mode: 0o755 });
fs.writeFileSync(path.join(outputDir, 'README-Mac.txt'), readme);

fs.rmSync(pkgPath, { force: true });

// ── platform gate ──────────────────────────────────────────────────────────
// A macOS Installer package is an XAR archive built by `pkgbuild`, which ships
// only in the Xcode Command Line Tools. There is no Windows or Linux equivalent,
// and the format cannot be faked reliably - a hand-rolled .pkg that macOS
// refuses to open is worse than no .pkg at all.
//
// This script previously did `console.warn(...); process.exit(0)` on Windows,
// which is the worst possible outcome: the command reported SUCCESS, the CI job
// went green, and no installer existed. It now fails loudly.
if (process.platform !== 'darwin') {
  console.error(
    `\n[mac] BUILD FAILED: a native .pkg can only be produced on macOS.\n` +
    `      host: ${os.platform()}/${os.arch()} — "pkgbuild" is a macOS-only tool.\n\n` +
    `      Fix by running this on macOS, or let CI build it for you:\n` +
    `        .github/workflows/scanner-bridge-macos.yml  (job: build-pkg)\n` +
    `      which runs on a macos-latest runner and uploads the .pkg artifact.`
  );
  process.exit(1);
}

try {
  run('pkgbuild', [
    '--root',
    payloadDir,
    '--identifier',
    'com.welttallis.restpoint-scanner-bridge',
    '--version',
    '1.0.0',
    '--install-location', '/',
    '--scripts',
    scriptsDir,
    pkgPath,
  ]);
} catch (error) {
  console.error('[mac] pkgbuild failed. Run this on a macOS host with Xcode CLT installed.');
  throw error;
}

// ── ad-hoc signature (no Apple Developer ID required) ──────────────────────
// Without any signature macOS treats the package as "downloaded from the
// internet" and the staff member hits the Gatekeeper wall
// ("cannot be opened because the developer cannot be verified").
//
// `--sign -` is an AD-HOC signature: it needs no certificate, no Apple account
// and no fee, and it is enough to give the package a stable identity. It does
// NOT make the package pass notarisation - only a paid Developer ID can do
// that - so the installer is still opened via right-click -> Open, or with the
// bundled force-install helper. Signing the inner binary as well stops macOS
// separately flagging the executable after the package is unpacked.
console.log('[mac] applying ad-hoc signature...');
try {
  run('codesign', ['--force', '--sign', '-', agentSourcePath]);
  console.log('[mac] signed the bridge binary');
} catch {
  console.warn('[mac] warn: could not ad-hoc sign the binary; continuing.');
}
try {
  run('codesign', ['--force', '--sign', '-', pkgPath]);
  console.log('[mac] signed the .pkg');
} catch {
  console.warn('[mac] warn: could not ad-hoc sign the .pkg; it will still install via the force-install helper.');
}

// Copy the force-install helper next to the package so staff who cannot get
// past Gatekeeper have a one-click path.
try {
  fs.copyFileSync(forceInstallHelper, path.join(path.dirname(pkgPath), 'Install Scanner Bridge.command'));
  fs.chmodSync(path.join(path.dirname(pkgPath), 'Install Scanner Bridge.command'), 0o755);
} catch { /* the helper is a convenience, not a requirement */ }

copyPkgToPublic();
console.log(`[mac] ready: ${pkgPath} (${os.platform()} build host)`);
console.log('[mac] unsigned-by-Apple: staff install it via right-click -> Open,');
console.log('[mac] or by running "Install Scanner Bridge.command" beside it.');
