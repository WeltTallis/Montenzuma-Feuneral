import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const workspaceRoot = path.resolve(root, '..', '..');
const pkgCommand = path.join(workspaceRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'pkg.cmd' : 'pkg');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const outputDir = path.join(root, 'dist', 'macos-package');
const payloadDir = path.join(outputDir, 'payload');
const scriptsDir = path.join(outputDir, 'scripts');
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
PLIST_DIR="/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/com.welttallis.restpoint-scanner-bridge.plist"

mkdir -p "$INSTALL_DIR" "$PLIST_DIR"
cp "/Library/Application Support/Restpoint Scanner Bridge/Restpoint Scanner Bridge" "$AGENT_PATH"
chmod 755 "$AGENT_PATH"

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
if (process.platform === 'win32') {
  console.warn('[mac] pkgbuild is not available on this Windows host. This script is ready to run on macOS, but no native .pkg was produced here.');
  console.log(`[mac] expected output: ${pkgPath}`);
  process.exit(0);
}

if (!fs.existsSync('which')) { /* no-op */ }
try {
  run('pkgbuild', [
    '--root',
    payloadDir,
    '--identifier',
    'com.welttallis.restpoint-scanner-bridge',
    '--version',
    '1.0.0',
    '--scripts',
    scriptsDir,
    pkgPath,
  ]);
} catch (error) {
  console.error('[mac] pkgbuild failed. Run this on a macOS host with Xcode CLT installed.');
  throw error;
}

copyPkgToPublic();
console.log(`[mac] ready: ${pkgPath} (${os.platform()} build host)`);