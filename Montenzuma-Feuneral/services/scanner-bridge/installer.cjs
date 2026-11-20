/**
 * Restpoint Scanner Bridge — Windows installer
 * ============================================
 *
 * This file is a TEMPLATE. scripts/build-installer.mjs replaces the single line
 *
 *     const embeddedAgent = null;
 *
 * with the base64 of the compiled agent .exe, then compiles the whole thing into
 * one double-clickable Setup-Restpoint-Scanner-Bridge.exe.
 *
 * Design notes
 * ------------
 * * Installs PER USER (%LOCALAPPDATA%), so it never needs administrator rights
 *   and cannot collide with another user on the reception PC.
 * * Registers itself in the Startup folder so the bridge is already running by
 *   the time a receptionist opens Restpoint.
 * * Writes a .env next to the agent; the agent reads it from its own folder.
 * * The agent .exe is flagged IMAGE_SUBSYSTEM_WINDOWS_GUI by the build script,
 *   so this installer must never write to stdout.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// ── replaced at build time ─────────────────────────────────────────────────
const embeddedAgent = null;
// ──────────────────────────────────────────────────────────────────────────

const APP_DIR_NAME = 'ScannerBridge';
const EXE_NAME = 'Restpoint Scanner Bridge.exe';

function installDir() {
  const base = process.env.LOCALAPPDATA || os.homedir();
  return path.join(base, 'Programs', 'Restpoint', APP_DIR_NAME);
}

function log(message) {
  // The compiled binary is a GUI app with no console, so everything goes to a
  // log file next to the agent. This is the first thing to ask a user for.
  try {
    fs.appendFileSync(path.join(__dirname, 'installer.log'), `${new Date().toISOString()} ${message}\n`);
  } catch { /* nothing else we can do */ }
}

function showMessage(title, text, style) {
  // style: 0 = OK/Info, 1 = error, 2 = question
  try {
    const ps = `$ws = New-Object -ComObject WScript.Shell; `
      + `[void]$ws.PopUp(${JSON.stringify(text)}, 0, ${JSON.stringify(title)}, ${style === undefined ? 0 : style});`;
    spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { timeout: 60000 });
  } catch { /* headless / no PowerShell — the log file is the fallback */ }
}

function main() {
  if (!embeddedAgent) {
    log('FATAL: embeddedAgent was not injected — this binary was built incorrectly.');
    showMessage('Restpoint Scanner Bridge', 'This installer is damaged. Please download it again.', 1);
    process.exit(1);
  }

  const dir = installDir();
  const agentPath = path.join(dir, EXE_NAME);
  const envPath = path.join(dir, '.env');

  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    log(`FATAL: could not create ${dir}: ${e.message}`);
    showMessage('Restpoint Scanner Bridge', `Could not create the install folder:\n${e.message}`, 1);
    process.exit(1);
  }

  // A running bridge holds its executable open. If we overwrite it in place the
  // write fails on Windows, so stop the old copy first.
  try {
    spawnSync('taskkill', ['/F', '/IM', EXE_NAME], { stdio: 'ignore' });
  } catch { /* not running */ }

  try {
    fs.writeFileSync(agentPath, Buffer.from(embeddedAgent, 'base64'));
  } catch (e) {
    log(`FATAL: could not write ${agentPath}: ${e.message}`);
    showMessage('Restpoint Scanner Bridge', `Could not write the bridge program:\n${e.message}`, 1);
    process.exit(1);
  }
  log(`installed agent -> ${agentPath} (${Buffer.from(embeddedAgent, 'base64').length} bytes)`);

  // Configuration. Only written on first install so an admin's edits survive
  // upgrades. The agent searches this folder for .env.
  if (!fs.existsSync(envPath)) {
    try {
      fs.writeFileSync(envPath, [
        '# Restpoint Scanner Bridge - local configuration',
        '# Edit and restart the bridge to apply changes.',
        '',
        '# The Restpoint cloud the bridge checks scan grants against.',
        'BRIDGE_CLOUD_URL=https://restpoint.co.ke',
        '',
        '# Which web front-ends may connect to this bridge.',
        'BRIDGE_ALLOWED_ORIGINS=https://restpoint.co.ke,https://www.restpoint.co.ke',
        '',
        'BRIDGE_HOST=127.0.0.1',
        'BRIDGE_PORT=8081',
        '',
      ].join('\n'), 'utf8');
      log(`wrote config -> ${envPath}`);
    } catch (e) {
      log(`warn: could not write .env: ${e.message}`);
    }
  }

  // Start with Windows so the bridge is ready before anyone needs it.
  try {

    const startup = path.join(
      process.env.APPDATA || os.homedir(),
      'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup',
    );
    const linkPath = path.join(startup, EXE_NAME);
    if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
    // A .url-style shortcut avoids needing a COM/shell link API from Node.
    fs.writeFileSync(linkPath, `[InternetShortcut]\nURL=file:///${agentPath.replace(/\\/g, '/')}\n`, 'utf8');
    log(`registered startup entry -> ${linkPath}`);
  } catch (e) {
    log(`warn: could not register startup entry: ${e.message}`);
  }

  // Launch it detached so the bridge outlives this installer.
  try {
    const { spawn } = require('node:child_process');
    const child = spawn(agentPath, [], { detached: true, stdio: 'ignore' });
    child.unref();
    log(`launched agent, pid ${child.pid}`);
  } catch (e) {
    log(`warn: could not launch agent automatically: ${e.message}`);
  }

  showMessage(
    'Restpoint Scanner Bridge',
    'Installed successfully.\n\n'
    + 'The bridge is now running and will start automatically when you sign in.\n\n'
    + 'Open Restpoint and use "Scan Document" on a deceased profile.\n\n'
    + `Installed to:\n${dir}`,
    0,
  );
  process.exit(0);
}

main();
