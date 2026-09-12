#!/usr/bin/env node
// 
// Scanner Bridge — release packager.
//  1. Builds dist/agent.js (via scripts/build.mjs)
//  2. Assembles release/restpoint-scanner-bridge-app/
//  3. Zips the folder → release/restpoint-scanner-bridge-app.zip
//     (host this at  https://<domain>/downloads/restpoint-scanner-bridge-app.zip)
// ─
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const releaseDir = path.join(root, 'release');
const appDir = path.join(releaseDir, 'restpoint-scanner-bridge-app');
const zipPath = path.join(releaseDir, 'restpoint-scanner-bridge-app.zip');

// ── 1. build the executable ─────────────────────────────────────────────────
console.log('[package] building dist/agent.js …');
await build({
  entryPoints: [path.join(root, 'src', 'agent.ts')],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  outfile: path.join(root, 'dist', 'agent.js'),
  external: ['bufferutil', 'libdeflate', 'ws-bufferutil', 'isomorphic-ws'],
  sourcemap: false,
  minify: false,
  logLevel: 'error',
});
const agentJs = fs.readFileSync(path.join(root, 'dist', 'agent.js'));
console.log(`[package]   agent.js: ${agentJs.length.toLocaleString()} bytes`);

// ── 1b. (optional) standalone agent.exe produced by `npm run build:exe` ──
let agentExe = null;
const exePath = path.join(root, 'dist', 'agent.exe');
if (fs.existsSync(exePath)) {
  agentExe = fs.readFileSync(exePath);
  console.log(`[package]   agent.exe: ${agentExe.length.toLocaleString()} bytes`);
} else {
  console.log('[package]   agent.exe: not found (run `npm run build:exe` first)');
}

// ── 2. minimal ZIP writer (deflate via zlib, CRC-32 implemented inline) ──────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};
const dosTimeDate = (d = new Date()) => ({
  time: ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF,
  date: (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF,
});

/** Build a zip in memory from { name, data: Buffer } entries (deflate). */
function makeZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const crc = crc32(e.data);
    const compressed = zlib.deflateRawSync(e.data, { level: 9 });
    const { time, date } = dosTimeDate();
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(0x0800, 6);      // flags: UTF-8 names
    local.writeUInt16LE(8, 8);           // method: deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(e.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, compressedThirtyNinePad(compressed));
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(compressed.length, 20);
    cd.writeUInt32LE(e.data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);   // extra
    cd.writeUInt16LE(0, 32);   // comment
    cd.writeUInt16LE(0, 34);   // disk
    cd.writeUInt16LE(0, 36);   // internal attrs
    cd.writeUInt32LE(0o644 << 16, 38); // external attrs
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    offset += local.length + nameBuf.length + compressed.length;
  }
  const cdStart = offset;
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(cdStart, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...chunks, cdBuf, end]);
}
// helper so the local-header chunk list stays flat
function compressedThirtyNinePad(compressed) { return compressed; }

// ── 3. installer / launcher file contents ────────────────────────────────────
const installBat = [
  '@echo off',
  'title Restpoint Scanner Bridge - Installer',
  'echo.',
  'echo ==========================================',
  'echo   Restpoint Scanner Bridge - Installer',
  'echo ==========================================',
  'echo.',
  'set "HERE=%~dp0"',
  'set "AGENT=%HERE%agent.exe"',
  'if not exist "%AGENT%" (',
  '  echo [ERROR] agent.exe not found next to this installer.',
  '  pause & exit /b 1',
  ')',
  'echo [OK] Scanner Bridge executable found (no Node.js required).',
  'echo.',
  'echo Installing startup shortcut (runs the bridge at every login)...',
  'set "STARTUP=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"',
  'set "LNK=%STARTUP%\\Restpoint Scanner Bridge.lnk"',
  'set "VBS=%TEMP%\\rp_scanner_bridge_shortcut.vbs"',
  '> "%VBS%" echo Set oWS = WScript.CreateObject("WScript.Shell")',
  '>> "%VBS%" echo sLinkFile = "%LNK%"',
  '>> "%VBS%" echo Set oLink = oWS.CreateShortcut(sLinkFile)',
  '>> "%VBS%" echo oLink.TargetPath = "%AGENT%"',
  '>> "%VBS%" echo oLink.WorkingDirectory = "%HERE%"',
  '>> "%VBS%" echo oLink.WorkingDirectory = "%HERE%"',
  '>> "%VBS%" echo oLink.Description = "Restpoint Scanner Bridge"',
  '>> "%VBS%" echo oLink.Save',
  'cscript //nologo "%VBS%"',
  'del "%VBS%" >nul 2>nul',
  'if exist "%LNK%" (echo [OK] Autostart installed.) else (echo [WARN] Autostart shortcut could not be created.)',
  'echo.',
  'echo Scanner driver: install NAPS2 (free, MIT) once so Windows TWAIN/WIA',
  'echo devices are visible:  https://github.com/nathaniel-mahieu/NAPS2',
  'echo Verify with:  naps2 list',
  'echo.',
  'echo Starting the bridge now...',
  'start "Restpoint Scanner Bridge" "%NODE_EXE%" "%AGENT%"',
  'echo.',
  'echo [DONE] The bridge is running on ws://localhost:8081.',
  'echo        Open Restpoint, go to a deceased profile and press "Scan Docs".',
  'echo.',
  'timeout /t 6 >nul',
].join('\r\n') + '\r\n';

const startBat = [
  '@echo off',
  'title Restpoint Scanner Bridge',
  'set "HERE=%~dp0"',
  'where node >nul 2>nul || (echo [ERROR] Node.js not found. Run the installer first. & pause & exit /b 1)',
  'for /f "delims=" %%i in (\'where node\') do set "NODE_EXE=%%i"',
  'echo Starting Restpoint Scanner Bridge on ws://localhost:8081 ...',
  '"%NODE_EXE%" "%HERE%agent.js"',
  'pause',
].join('\r\n') + '\r\n';

const uninstallBat = [
  '@echo off',
  'title Restpoint Scanner Bridge - Uninstall',
  'set "LNK=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Restpoint Scanner Bridge.lnk"',
  'if exist "%LNK%" (del "%LNK%" & echo [OK] Autostart removed.) else (echo Autostart shortcut not found.)',
  'taskkill /FI "WINDOWTITLE eq Restpoint Scanner Bridge*" >nul 2>nul',
  'echo Bridge processes with that window title were stopped (if any).',
  'pause',
].join('\r\n') + '\r\n';

const installSh = [
  '#!/usr/bin/env bash',
  'set -e',
  'echo "== Restpoint Scanner Bridge installer =="',
  'command -v node >/dev/null 2>&1 || { echo "[ERROR] Node.js 22+ is required."; exit 1; }',
  'HERE="$(cd "$(dirname "$0")" && pwd)"',
  'mkdir -p "$HOME/.restpoint-scanner-bridge"',
  'cp -f "$HERE/agent.js" "$HOME/.restpoint-scanner-bridge/agent.js"',
  'SERVICE_DIR="$HOME/.config/systemd/user"',
  'if [ -d "$HOME/.config" ]; then',
  '  mkdir -p "$SERVICE_DIR"',
  '  cat > "$SERVICE_DIR/restpoint-scanner-bridge.service" <<EOF',
  '[Unit]',
  'Description=Restpoint Scanner Bridge',
  '[Service]',
  'ExecStart=%h/.restpoint-scanner-bridge/node-run.sh',
  'Restart=always',
  '[Install]',
  'WantedBy=default.target',
  'EOF',
  '  cat > "$HOME/.restpoint-scanner-bridge/node-run.sh" <<EOF',
  '#!/usr/bin/env bash',
  'exec "$(command -v node)" "$HOME/.restpoint-scanner-bridge/agent.js"',
  'EOF',
  '  chmod +x "$HOME/.restpoint-scanner-bridge/node-run.sh"',
  '  systemctl --user daemon-reload || true',
  '  systemctl --user enable --now restpoint-scanner-bridge.service || true',
  '  echo "[OK] systemd user service installed and started."',
  'else',
  '  echo "[i] No systemd user session detected - start it with: ./start.sh"',
  'fi',
  'echo "[DONE] Bridge installed. Open Restpoint and press Scan Docs on a profile."',
].join('\n') + '\n';

const startSh = ['#!/usr/bin/env bash', 'cd "$(dirname "$0")"', 'exec node agent.js'].join('\n') + '\n';
const uninstallSh = [
  '#!/usr/bin/env bash',
  'systemctl --user disable --now restpoint-scanner-bridge.service 2>/dev/null || true',
  'rm -rf "$HOME/.restpoint-scanner-bridge"',
  'echo "[OK] Bridge removed."',
].join('\n') + '\n';

const readmeTxt = [
  'Restpoint Scanner Bridge - README FIRST',
  '=======================================',
  '',
  'WHAT THIS IS',
  '  A small background app for the reception computer. It listens on',
  '  ws://localhost:8081 and lets the Restpoint web app drive the physical',
  '  scanner: click "Scan Docs" on a deceased profile -> the scanner runs ->',
  '  a PDF is produced -> it is uploaded straight into that profile Documents.',
  '',
  'QUICK INSTALL (Windows)',
  '  1. Install Node.js 22 or newer if you do not have it (https://nodejs.org).',
  '  2. Double-click  Install-Restpoint-Scanner-Bridge.bat',
  '     - installs a startup shortcut (runs at every login)',
  '     - starts the bridge immediately',
  '  3. Install the free NAPS2 scanner driver once:',
  '     https://github.com/nathaniel-mahieu/NAPS2',
  '     Verify the scanner is visible:  naps2 list',
  '',
  'USE IT',
  '  In Restpoint: open a deceased profile -> press "Scan Docs".',
  '  Put the paper in the scanner tray and press "Scan Document".',
  '',
  'TROUBLESHOOTING',
  '  - "Scanner Bridge not found": start the bridge (Start-Restpoint-Scanner-Bridge.bat)',
  '  - Scanner not detected: run "naps2 list", then set the scanner name, e.g.',
  '      set SCANNER_NAME=HP ScanJet Pro 2600 f1',
  '      node agent.js',
  '',
  'UNINSTALL',
  '  Double-click  Uninstall-Restpoint-Scanner-Bridge.bat',
  '',
].join('\n');

// ── 4. assemble release folder + zip ────────────────────────────────────────
fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(appDir, { recursive: true });
const files = [
  ['agent.js', agentJs],
  ['Install-Restpoint-Scanner-Bridge.bat', Buffer.from(installBat)],
  ['Start-Restpoint-Scanner-Bridge.bat', Buffer.from(startBat)],
  ['Uninstall-Restpoint-Scanner-Bridge.bat', Buffer.from(uninstallBat)],
  ['install.sh', Buffer.from(installSh)],
  ['start.sh', Buffer.from(startSh)],
  ['uninstall.sh', Buffer.from(uninstallSh)],
  ['README-FIRST.txt', Buffer.from(readmeTxt)],
];
for (const [name, data] of files) fs.writeFileSync(path.join(appDir, name), data);
console.log(`[package]   app folder: ${appDir}`);

const zip = makeZip(files.map(([name, data]) => ({ name: `restpoint-scanner-bridge-app/${name}`, data })));
fs.mkdirSync(releaseDir, { recursive: true });
fs.writeFileSync(zipPath, zip);
console.log(`[package]   zip: ${zipPath} (${(zip.length / 1024).toFixed(1)} KB)`);
console.log('[package] done - host the zip at  https://<domain>/downloads/restpoint-scanner-bridge-app.zip');