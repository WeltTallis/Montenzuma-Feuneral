import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const workspaceRoot = path.resolve(root, '..', '..');

/**
 * Locate the `pkg` executable. This used to hardcode
 * `<workspaceRoot>/node_modules/.bin/pkg`, so when npm did not hoist the
 * package the build failed with a bare "'...\pkg.cmd' is not recognized",
 * which looks like a broken script instead of a missing dependency.
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
    `\n[installer] BUILD FAILED: the "pkg" compiler is not installed.\n` +
    `      Looked in:\n        ${candidates.join('\n        ')}\n\n` +
    `      Fix by installing it:\n        npm install --legacy-peer-deps\n`
  );
  process.exit(1);
}

const pkgCommand = resolvePkgCommand();
const agentExe = path.join(root, 'dist', 'agent.exe');
const installerExe = path.join(root, 'dist', 'Setup-Restpoint-Scanner-Bridge.exe');
const installerTemplate = path.join(root, 'installer.cjs');
const installerBundle = path.join(root, 'dist', 'installer-bundle.cjs');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

function makeWindowsGui(exePath) {
  const buffer = fs.readFileSync(exePath);
  if (buffer.readUInt16LE(0) !== 0x5a4d) throw new Error(`${exePath} is not a Windows executable`);
  const peOffset = buffer.readUInt32LE(0x3c);
  if (buffer.toString('ascii', peOffset, peOffset + 4) !== 'PE\0\0') throw new Error(`${exePath} has no PE header`);
  const subsystemOffset = peOffset + 24 + 68;
  buffer.writeUInt16LE(2, subsystemOffset); // IMAGE_SUBSYSTEM_WINDOWS_GUI
  fs.writeFileSync(exePath, buffer);
}

console.log('[installer] building bridge bundle...');
run(npmCommand, ['run', 'build']);
console.log('[installer] compiling agent.exe...');
run(pkgCommand, ['dist/agent.js', '--targets', 'node18-win-x64', '--output', agentExe, '--compress', 'GZip']);
makeWindowsGui(agentExe);
console.log('[installer] compiling single-file installer...');
const template = fs.readFileSync(installerTemplate, 'utf8');
const embeddedAgent = fs.readFileSync(agentExe).toString('base64');
fs.writeFileSync(installerBundle, template.replace(
  'const embeddedAgent = null;',
  `const embeddedAgent = Buffer.from('${embeddedAgent}', 'base64');`,
));
run(pkgCommand, [
  installerBundle,
  '--targets',
  'node18-win-x64',
  '--output',
  installerExe,
  '--compress',
  'GZip',
]);
fs.unlinkSync(installerBundle);
makeWindowsGui(installerExe);
console.log(`[installer] ready: ${installerExe}`);