#!/usr/bin/env node
/**
 * RestPoint Docker disk reclamation.
 *
 * Run this on the production server to free the ~60GB that the old bloated
 * images + build cache were consuming:
 *
 *   docker system df                          <- see the damage
 *   node scripts/docker-cleanup.mjs           <- preview what will go
 *   node scripts/docker-cleanup.mjs --apply   <- actually delete
 *
 * What it reclaims:
 *   1. Build cache (12.15 GB, 0B reclaimable normally) — full prune
 *   2. Dangling images (intermediate layers) — safe, always removable
 *   3. Old/unused <svc>:latest duplicates (e.g. `florist-service`, `frontend`
 *      when the real image is `restpoint-*`) — listed for manual review
 *   4. The build-tool bloat inside old images is gone once you rebuild with
 *      the new multi-stage Dockerfiles (see scripts/generate-dockerfiles.mjs)
 *
 * SAFETY: never removes the active `restpoint-*` images the containers run,
 * never touches named data volumes (mariadb/redis/rabbitmq/grafana/loki/
 * prometheus), and never removes images currently referenced by a running
 * container.
 */

import { execSync } from 'node:child_process';

const APPLY = process.argv.includes('--apply');
const DRY = !APPLY;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

function header(t) {
  console.log(`\n# ${t}`);
}

const df = run('docker system df');
header('Current disk usage');
console.log(df);

// ---- 1. Build cache ----
const cacheInfo = run('docker builder prune --filter "until=24h" --dry-run 2>&1');
header('1. Build cache (prune older than 24h)');
console.log(cacheInfo.trim() || '(no builder prune dry-run output)');
if (APPLY) {
  console.log(run('docker builder prune --force --filter "until=24h"'));
}

// ---- 2. Dangling images ----
header('2. Dangling images (intermediate layers, no tags)');
const dangling = run('docker images -f "dangling=true" --format "{{.ID}} {{.Size}}"')
  .trim().split('\n').filter(Boolean);
console.log(dangling.length ? dangling.join('\n') : '(none)');
if (APPLY && dangling.length) {
  console.log(run('docker image prune --force'));
}

// ---- 3. Old/unused duplicate <svc>:latest images ----
// The repo historically pushed both `restpoint-deceased-service` and a bare
// `deceased-service`. The bare ones are unused orphans once the restpoint-*
// images exist. List them; delete only on --apply.
header('3. Potentially unused bare <svc>:latest images');
const allImages = run('docker images --format "{{.Repository}}:{{.Tag}}|{{.Size}}|{{.ID}}"')
  .trim().split('\n').filter(Boolean);
const restpointSet = new Set(
  allImages.filter((l) => l.startsWith('restpoint-')).map((l) => l.split(':')[0].replace('restpoint-', ''))
);
const candidates = [];
for (const line of allImages) {
  const [repo, size, id] = line.split('|');
  const name = repo.split(':')[0];
  if (repo.endsWith(':latest') && restpointSet.has(name) && !repo.startsWith('restpoint-')) {
    // verify no running container uses it
    const used = run(`docker ps -a --filter ancestor=${repo} --format "{{.ID}}"`).trim();
    candidates.push({ repo, size, id, used: !!used });
  }
}
if (candidates.length) {
  console.log('Repo'.padEnd(34) + 'Size'.padEnd(12) + 'In use?'.padEnd(10) + 'ID');
  for (const c of candidates) {
    console.log(c.repo.padEnd(34) + c.size.padEnd(12) + (c.used ? 'YES (skip)' : 'no').padEnd(10) + c.id);
  }
  const deletable = candidates.filter((c) => !c.used);
  if (APPLY && deletable.length) {
    console.log(run(`docker rmi ${deletable.map((c) => c.id).join(' ')}`));
  } else if (deletable.length) {
    console.log(`\n--apply would remove ${deletable.length} unused image(s) listed above.`);
  }
} else {
  console.log('(none — images are already normalized to restpoint-*)');
}

// ---- 4. Volume orphans (anonymous) ----
header('4. Anonymous volumes (build/test leftovers, NOT data volumes)');
const anon = run('docker volume ls -f dangling=true --format "{{.Name}}|{{.Size}}" 2>/dev/null || docker volume ls -f dangling=true --format "{{.Name}}"')
  .trim().split('\n').filter((l) => l && !l.includes('driver'));
console.log(anon.length ? anon.join('\n') : '(none)');
console.log('NOTE: named volumes (mariadb_data, redis_data, etc.) are NOT touched.');

// ---- Final ----
header(DRY ? 'Dry run complete — re-run with --apply to reclaim space' : 'Reclamation done. New usage:');
if (APPLY) console.log(run('docker system df'));
console.log('\nTo rebuild all services slim:  docker compose build --parallel');
