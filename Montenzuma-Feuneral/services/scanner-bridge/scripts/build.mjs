// ─────────────────────────────────────────────────────────────────────────────
// Scanner Bridge — production build script.
// Compiles src/agent.ts into a SINGLE self-contained executable file:
//   dist/agent.js   (CJS, Node 24+, `ws` inlined)
// This one file is the ONLY artifact that ships to production.
// ─────────────────────────────────────────────────────────────────────────────
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outfile = path.join(root, 'dist', 'agent.js');

// `ws` pulls in optional native accelerators behind try/catch — keep them
// external so the bundler never tries to resolve (and ship) them.
const wsOptionalExtras = ['bufferutil', 'libdeflate', 'ws-bufferutil', 'isomorphic-ws'];

await build({
  entryPoints: [path.join(root, 'src', 'agent.ts')],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  outfile,
  external: wsOptionalExtras,
  sourcemap: false,
  minify: false,
  logLevel: 'info',
});

console.log(`[scanner-bridge] ✅ built ${outfile}\n[scanner-bridge]    ship this single executable to the reception computer.`);