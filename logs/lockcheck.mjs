import fs from 'node:fs';
const l = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const pk = l.packages;
const keys = [
  'node_modules/express-rate-limit',
  'node_modules/express',
  'node_modules/express-async-handler',
  'services/api-gateway',
  'services/auth-service',
  'packages/shared-config',
  'packages/shared-logger',
  'packages/shared-services',
  'shared',
];
for (const k of keys) {
  const v = pk[k];
  if (!v) { console.log(k, 'MISSING'); continue; }
  console.log(k, { dev: v.dev, version: v.version, link: v.link, resolved: v.resolved ? v.resolved.slice(0, 40) : undefined });
  if (v.dependencies) console.log('   deps:', v.dependencies);
}
console.log('--- all lockfile keys mentioning rate-limit ---');
for (const k of Object.keys(pk).filter((k) => k.toLowerCase().includes('rate-limit'))) {
  console.log(k, JSON.stringify({ dev: pk[k].dev, version: pk[k].version, link: pk[k].link }));
}
