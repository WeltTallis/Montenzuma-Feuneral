/**
 * List the compose services that declare a `build:` block — one per line.
 *
 * The Makefile builds exactly this set of services before running `up`. It is
 * derived from the compose file rather than hand-maintained so that a service
 * added to docker-compose.yml / docker-compose.prod.yml can never be silently
 * skipped. That is precisely how `florist-service` went missing from the old
 * hardcoded list and made `make prod-up` fail with:
 *
 *     Error response from daemon: No such image: restpoint-florist-service:latest
 *
 * Usage:
 *   docker compose config --format json | node scripts/compose-build-services.mjs
 *   node scripts/compose-build-services.mjs --images      # "<service>\t<image>"
 *   node scripts/compose-build-services.mjs --image-list  # "<image>" only
 *
 * Exits 0 with no output on malformed/empty input so a Docker hiccup degrades
 * into an empty list instead of breaking every Makefile target.
 */
'use strict';

const args = process.argv.slice(2);
let mode = 'services';
if (args.includes('--images') || args.includes('--with-images')) mode = 'images';
if (args.includes('--image-list') || args.includes('--images-only')) mode = 'image-list';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});

process.stdin.on('end', () => {
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const services = (doc && doc.services) || {};
  for (const name of Object.keys(services).sort()) {
    const svc = services[name];
    if (!svc || !svc.build) continue; // mariadb/redis/rabbitmq are pulled, not built
    if (mode === 'services') {
      console.log(name);
    } else if (mode === 'images') {
      console.log(`${name}\t${svc.image || ''}`);
    } else if (mode === 'image-list' && svc.image) {
      console.log(svc.image);
    }
  }
});
