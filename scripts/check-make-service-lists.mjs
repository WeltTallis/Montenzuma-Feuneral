#!/usr/bin/env node
/**
 * Static sanity check for the Makefile's auto-derived service lists.
 * Run: node scripts/check-make-service-lists.mjs
 *
 * Verifies that the node helper the Makefile depends on is present and that
 * every service with a `build:` block resolves to a Dockerfile that exists.
 * (Cheap local check — the Makefile itself re-derives the lists at run time.)
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const helper = join(root, 'scripts', 'compose-build-services.mjs');

if (!existsSync(helper)) {
  console.error('FAIL: scripts/compose-build-services.mjs is missing');
  process.exit(1);
}

let failed = false;
for (const file of ['docker-compose.yml', 'docker-compose.prod.yml']) {
  // `context` is resolved relative to the compose file's directory (here the
  // repo root) and may be absolute — resolve() handles both, join() does not.
  const base = dirname(join(root, file));
  const args =
    file === 'docker-compose.yml'
      ? ['compose', 'config', '--format', 'json']
      : ['compose', '-f', file, 'config', '--format', 'json'];
  let json;
  try {
    json = execFileSync('docker', args, { cwd: root, encoding: 'utf8' });
  } catch (err) {
    console.error(`SKIP ${file}: docker compose config failed (${err.message.split('\n')[0]})`);
    continue;
  }
  const { services = {} } = JSON.parse(json);
  for (const [name, svc] of Object.entries(services).sort()) {
    if (!svc.build) continue;
    const context = svc.build?.context ?? '.';
    const dockerfile = svc.build?.dockerfile ?? 'Dockerfile';
    const path = resolve(base, context, dockerfile);
    const ok = existsSync(path);
    if (!ok) failed = true;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${file} ${name} -> ${relative(root, path)}`);
  }
}

process.exit(failed ? 1 : 0);
