/**
 * verify-container-paths.mjs
 * ---------------------------------------------------------------------------
 * Regression proof for the documents-service startup crash:
 *   [ConnectionManager] 💥 Uncaught exception: Cannot find module
 *   '../../../packages/shared-utils/dist/timestamps'
 *
 * Rebuilds the *container* shape of the app root in a temp dir
 *   <tmp>/packages/shared-utils/dist/timestamps.js
 *   <tmp>/services/documents-service/server.js
 * then uses Node's own resolver (createRequire) against that entry point to show
 *   1. '../../../packages/shared-utils/dist/timestamps'  -> MODULE_NOT_FOUND
 *   2. '../../packages/shared-utils/dist/timestamps'     -> resolves
 *
 * Run:  npm run check:paths:container
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'restpoint-app-'));

fs.mkdirSync(path.join(tmp, 'packages', 'shared-utils', 'dist'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'services', 'documents-service'), { recursive: true });
fs.copyFileSync(
  path.join(ROOT, 'packages', 'shared-utils', 'dist', 'timestamps.js'),
  path.join(tmp, 'packages', 'shared-utils', 'dist', 'timestamps.js')
);

const entry = path.join(tmp, 'services', 'documents-service', 'server.js');
fs.writeFileSync(entry, '// container-shaped service entry point\n');
const req = createRequire(entry);

let oldFailure = 'did not throw';
try {
  req.resolve('../../../packages/shared-utils/dist/timestamps');
} catch (err) {
  oldFailure = `${err.code}: ${err.message.split('\n')[0]}`;
}

let fixedResult = 'FAILED TO RESOLVE';
try {
  fixedResult = path.relative(tmp, req.resolve('../../packages/shared-utils/dist/timestamps'));
} catch (err) {
  fixedResult = err.message;
}

console.log('Temp app root (mirrors /usr/src/app):', tmp);
console.log('\n1) OLD specifier "' + '../../../packages/shared-utils/dist/timestamps"');
console.log('   ->', oldFailure);
console.log('\n2) NEW specifier "../../packages/shared-utils/dist/timestamps"');
console.log('   ->', fixedResult);

// Third-party edge: the real repo file must also resolve from its real location.
const repoReq = createRequire(path.join(ROOT, 'services', 'documents-service', 'server.js'));
console.log('\n3) Repo copy of services/documents-service/server.js resolves its own specifier:');
console.log('   ->', repoReq.resolve('../../packages/shared-utils/dist/timestamps'));

// And the module itself must actually load + export the helper it is destructured for.
const mod = await import(
  new URL(`file:///${path.join(ROOT, 'packages', 'shared-utils', 'dist', 'timestamps.js').replace(/\\/g, '/')}`).href
);
console.log('\n4) dist/timestamps.js exports:', Object.keys(mod));
console.log('   getKenyaTimeISO() =', typeof mod.getKenyaTimeISO === 'function' ? mod.getKenyaTimeISO() : 'MISSING');

fs.rmSync(tmp, { recursive: true, force: true });