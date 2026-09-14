// Validates the api-gateway / auth-service Dockerfile GUARDs against the local
// install tree (repo root node_modules = full workspace; services/auth-service
// resolves nested express@5 etc.). Mirrors `node -e "...require.resolve(p)..."`
// that the generator now emits in each prod-deps stage. No shell quoting needed.
import { spawnSync } from 'node:child_process';

function runGuard(label, cwd, pkgs) {
  console.log(`=== ${label} (cwd: ${cwd}) ===`);
  // node -e with the exact require.resolve loop from the Dockerfile GUARD
  const code = `[${pkgs.map((p) => `'${p}'`).join(',')}]].forEach(p=>require.resolve(p)); console.log('[GUARD] OK')`.replace(']]', ']');
  const r = spawnSync(process.execPath, ['-e', code], { cwd, encoding: 'utf8' });
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  console.log(`exit=${r.status}\n`);
  return r.status === 0;
}

const root = 'c:/Users/User/Downloads/restpoint';

const gw = runGuard('api-gateway guard', root, [
  'express-rate-limit', 'express', 'http-proxy-middleware', 'helmet',
  'dotenv', 'cors', 'cookie-parser', 'hpp', 'express-async-handler',
]);

const auth = runGuard('auth-service guard', `${root}/services/auth-service`, [
  'express', 'express-rate-limit', 'express-session', 'helmet', 'hpp',
  'cors', 'cookie-parser', 'dotenv', 'validator', 'bcryptjs',
  'jsonwebtoken', 'redis', 'mysql2',
]);

console.log(gw && auth ? 'ALL GUARDS PASS' : 'GUARD FAILED');
process.exit(gw && auth ? 0 : 1);
