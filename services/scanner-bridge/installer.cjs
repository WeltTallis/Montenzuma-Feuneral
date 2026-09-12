const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, spawn } = require('node:child_process');

const embeddedAgent = null;
const siblingAgent = path.join(path.dirname(process.execPath), 'agent.exe');

const installDir = path.join(process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local'), 'Restpoint Scanner Bridge');
const targetExe = path.join(installDir, 'agent.exe');

if (!embeddedAgent && !fs.existsSync(siblingAgent)) {
  process.exit(1);
}

fs.mkdirSync(installDir, { recursive: true });
if (embeddedAgent) fs.writeFileSync(targetExe, embeddedAgent);
else fs.copyFileSync(siblingAgent, targetExe);

const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
fs.mkdirSync(startupDir, { recursive: true });
const lnk = path.join(startupDir, 'Restpoint Scanner Bridge.lnk');
const launcher = path.join(installDir, 'start-hidden.vbs');
fs.writeFileSync(launcher, [
  'Set oWS = WScript.CreateObject("WScript.Shell")',
  'oWS.Run """' + targetExe + '""", 0, False',
].join('\n'));
const vbs = path.join(process.env.TEMP, 'rp_scanner_bridge_shortcut.vbs');
fs.writeFileSync(vbs, [
  'Set oWS = WScript.CreateObject("WScript.Shell")',
  'sLinkFile = "' + lnk + '"',
  'Set oLink = oWS.CreateShortcut(sLinkFile)',
  'oLink.TargetPath = "' + path.join(process.env.WINDIR || 'C:\\Windows', 'System32', 'wscript.exe') + '"',
  'oLink.Arguments = """' + launcher + '"""',
  'oLink.WorkingDirectory = "' + installDir + '"',
  'oLink.Description = "Restpoint Scanner Bridge"',
  'oLink.Save',
].join('\n'));
spawnSync('cscript', ['//nologo', vbs], { stdio: 'ignore' });
try { fs.unlinkSync(vbs); } catch { /* ignore */ }

spawn('wscript.exe', [launcher], { detached: true, stdio: 'ignore', cwd: installDir });