#!/usr/bin/env node
/**
 * RestPoint dependency cleanup — applies the curated plan produced from
 * scripts/scan-dependencies.mjs (see scripts/dependency-report.json).
 *
 *  1. Root package.json: strips every dependency that no backend workspace
 *     imports (puppeteer/Chrome!, three, chart.js, react-*, tesseract.js, …).
 *     Dev-only utilities used by root scripts move to devDependencies.
 *  2. Phantom dependencies: every module a workspace imports while relying on
 *     npm hoisting gets DECLARED in that workspace, so the slim multi-stage
 *     Docker builds (--omit=dev + per-service manifests) keep resolving.
 *  3. Unused dependencies (declared but never imported anywhere) are removed.
 *
 * Dry-run by default. Apply with:  node scripts/fix-dependencies.mjs --apply
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const APPLY = process.argv.includes('--apply');

/** Resolve the installed version of a package to a caret range (falls back). */
function installedRange(name, fallback) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8'));
    return `^${pkg.version}`;
  } catch {
    return fallback;
  }
}

/** Current declared range in another workspace's package.json. */
function rangeFrom(wsDir, name, fallback) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, wsDir, 'package.json'), 'utf8'));
    return pkg.dependencies?.[name] || pkg.devDependencies?.[name] || fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// The plan (curated from the scanner report)
// ---------------------------------------------------------------------------

const plan = {
  root: {
    // Everything below is either imported by nobody (whole repo) or only by
    // workspaces that declare it themselves (verified by the scanner report).
    removeDeps: [
      // frontend-only libs that leaked into the backend root:
      'chart.js', 'qrcode.react', 'react-router-dom', 'react-signature-canvas',
      'three', 'tesseract.js', 'prop-types',
      // heavyweight + unused anywhere:
      'puppeteer', // downloads Chrome in EVERY docker build — biggest win
      'bcryptjs', 'braces', 'bull', 'compression', 'csurf', 'exceljs',
      'path-to-regexp', 'pino-loki', 'to-regex-range',
      // only used by other workspaces (they declare their own after this fix):
      'axios', 'express-rate-limit', 'express-session', 'helmet', 'hpp',
      'http-proxy-middleware', 'ioredis', 'knex', 'multer', 'node-cron',
      'sharp',
      // @types for packages no root code compiles against:
      '@types/bcryptjs', '@types/cookie-parser', '@types/express-session',
      '@types/validator',
      // used only by root dev scripts → belong in devDependencies:
      'jsonwebtoken', 'mysql2', '@types/jsonwebtoken',
    ],
    // pdfkit is KEPT in root: 5+ services use it at runtime. Hoisting it once
    // at root makes npm install a single, complete transitive tree (fontkit,
    // crypto-js) — declaring it per-service nests incomplete copies that fail
    // to resolve under --omit=dev.
    removeDevDeps: ['pino', 'vite-plugin-compression2', '@types/pino', '@types/hpp'],
    // root dev scripts (auto-update.js, test-socketio.mjs, fix-auth-plugin.js,
    // mini-store-final-verify.mjs, provision-worker.ts) import these via
    // hoisting today — declare them properly as devDependencies:
    addDevDeps: {
      axios: installedRange('axios', '^1.18.1'),
      cors: rangeFrom('services/chemical-service', 'cors', '^2.8.5'),
      dotenv: rangeFrom('services/chemical-service', 'dotenv', '^16.4.5'),
      express: rangeFrom('services/chemical-service', 'express', '^5.1.0'),
      jsonwebtoken: rangeFrom('services/chemical-service', 'jsonwebtoken', '^9.0.2'),
      '@types/jsonwebtoken': rangeFrom('.', '@types/jsonwebtoken', '^9.0.10'),
      mysql2: rangeFrom('services/chemical-service', 'mysql2', '^3.23.3'),
      redis: rangeFrom('services/socketio-service', 'redis', '^5.8.2'),
      'socket.io': rangeFrom('services/socketio-service', 'socket.io', '^4.8.1'),
      '@socket.io/redis-adapter': rangeFrom('services/socketio-service', '@socket.io/redis-adapter', '^8.3.0'),
    },
  },
  workspaces: {
    'packages/shared-logger': {
      // pino-pretty: never imported/configured anywhere.
      // pino-loki: used as a pino TRANSPORT STRING in src/logger.ts
      //   (`target: 'pino-loki'` when LOKI_ENABLED=true) — a static-import
      //   scan can't see it, so it is DECLARED HERE before the root copy is
      //   dropped. Loki shipping is active in production.
      removeDeps: ['pino-pretty'],
      addDeps: { 'pino-loki': rangeFrom('.', 'pino-loki', '^3.0.0') },
    },
    'packages/shared-services': {
      removeDeps: ['yallist'],
      addDeps: {
        sharp: installedRange('sharp', '^0.35.3'),
        redis: rangeFrom('services/socketio-service', 'redis', '^5.8.2'),
      },
    },
    'packages/shared-stamps': { removeDevDeps: ['@types/pdfkit'] },
    'packages/shared-config': {
      // express is used ONLY via `import type` (tenancy.ts, types.ts) → needed
      // for tsc builds, never at runtime.
      addDevDeps: { express: rangeFrom('services/chemical-service', 'express', '^5.1.0') },
    },
    shared: {
      addDeps: {
        axios: installedRange('axios', '^1.18.1'),       // serviceClient.js (runtime)
        'prom-client': installedRange('prom-client', '^15.1.3'), // monitoring-middleware.js (runtime)
      },
      // express via `import type` only (utils/softDelete.ts)
      addDevDeps: { express: rangeFrom('services/chemical-service', 'express', '^5.1.0') },
    },
    'services/analytics-service': {
      removeDeps: ['bcrypt', 'bull', 'csurf', 'object-assign'],
      removeDevDeps: ['@types/jsonwebtoken'],
    },
    'services/api-gateway': {
      removeDeps: ['undici'],
      removeDevDeps: ['rimraf', 'typescript'],
    },
    'services/auth-service': {
      removeDeps: ['object-assign', 'semver', 'sqlstring'],
      addDeps: {
        // installedRange → ^8.3.0 (what auth resolves today via the root);
        // chemical-service still declares ^7 but that must not leak here.
        helmet: installedRange('helmet', '^8.3.0'),
        'express-rate-limit': installedRange('express-rate-limit', '^8.6.0'),
        redis: rangeFrom('services/socketio-service', 'redis', '^5.8.2'),
        yargs: installedRange('yargs', '^17.7.2'),
      },
    },
    'services/billing-service': {
      removeDeps: ['bull', 'csurf'],
      addDeps: { pino: installedRange('pino', '^10.3.1') },
      removeDevDeps: ['ts-node-dev', 'typescript'],
    },
    'services/bodycheckout-service': {
      removeDeps: ['bcrypt', 'object-assign'],
      addDeps: {
        axios: installedRange('axios', '^1.18.1'),
        sharp: installedRange('sharp', '^0.35.3'),
      },
    },
    'services/coffin-service': {
      removeDeps: ['bcrypt', 'bull', 'csurf', 'generic-pool', 'object-assign'],
      addDeps: { axios: installedRange('axios', '^1.18.1') },
      removeDevDeps: ['rimraf'],
    },
    // deceased imports pdfkit at runtime (controllers/autopsyControl.ts) but
    // only declared it in devDependencies — with --omit=dev that breaks.
    // Align with the root's former pdfkit (^0.19.1), which ships fontkit in a
    // layout that resolves cleanly (the stale devDep ^0.13.0 nested its own
    // fontkit and failed to resolve its ESM/CJS entry under --omit=dev).
    'services/deceased-service': {
      removeDeps: ['bcrypt', 'bull', 'csurf', 'object-assign', 'puppeteer-core'],
      removeDevDeps: ['@types/puppeteer-core'],
      moveToDeps: { pdfkit: '^0.19.1' },
    },
    'services/documents-service': { removeDeps: ['bcrypt', 'object-assign'] },
    'services/florist-service': {
      addDeps: {
        axios: installedRange('axios', '^1.18.1'),
        knex: installedRange('knex', '^3.3.0'),
        multer: '2.2.0',
      },
    },
    'services/hearse-service': {
      addDeps: { 'node-cron': installedRange('node-cron', '^4.6.0') },
      removeDevDeps: ['@types/jsonwebtoken'],
    },
    // NOTE: invoice keeps tsx in prod deps (CMD runs `npx tsx`).
    'services/invoice-service': { removeDeps: ['bcrypt', 'jpeg-exif', 'node-cache'] },
    'services/leave-service': { removeDeps: ['body-parser'] },
    'services/socketio-service': {
      addDeps: {
        cors: rangeFrom('services/chemical-service', 'cors', '^2.8.5'),
        'express-rate-limit': installedRange('express-rate-limit', '^8.6.0'),
      },
    },
    'services/tenant-service': { removeDeps: ['bcrypt'], removeDevDeps: ['tsx'] },
    'services/workshop-service': {
      addDeps: {
        axios: installedRange('axios', '^1.18.1'),
        knex: installedRange('knex', '^3.3.0'),
      },
      removeDevDeps: ['@types/bcryptjs', '@types/jsonwebtoken'],
    },
    // The SPA imports tesseract.js (bundled by Vite) but relied on the root.
    'FrontendClient/client': { addDeps: { 'tesseract.js': '^7.0.0' } },
  },
};

// ---------------------------------------------------------------------------
// apply logic
// ---------------------------------------------------------------------------

function applyToPackage(wsDir, changes, label) {
  const file = path.join(ROOT, wsDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const report = [];

  const removeFrom = (section, list) => {
    if (!list?.length || !pkg[section]) return;
    for (const name of list) {
      if (pkg[section][name] !== undefined) {
        report.push(`  - ${section}.${name}: ${pkg[section][name]}`);
        delete pkg[section][name];
      }
    }
  };

  const addTo = (section, map) => {
    if (!map) return;
    pkg[section] = pkg[section] || {};
    for (const [name, range] of Object.entries(map)) {
      if (!range) continue;
      if (pkg[section][name] === range) continue;
      report.push(`  + ${section}.${name}: ${range}`);
      pkg[section][name] = range;
    }
  };

  const moveToDeps = (map) => {
    if (!map) return;
    pkg.dependencies = pkg.dependencies || {};
    pkg.devDependencies = pkg.devDependencies || {};
    for (const [name, overrideRange] of Object.entries(map)) {
      const cur = pkg.devDependencies[name];
      const newRange = overrideRange || cur;
      if (!newRange) continue;
      if (cur) delete pkg.devDependencies[name];
      if (pkg.dependencies[name] === newRange) continue;
      report.push(`  ~ dependencies.${name}: ${newRange} (was ${cur ? `devDependencies.${cur}` : 'absent'})`);
      pkg.dependencies[name] = newRange;
    }
  };

  removeFrom('dependencies', changes.removeDeps);
  removeFrom('devDependencies', changes.removeDevDeps);
  addTo('dependencies', changes.addDeps);
  addTo('devDependencies', changes.addDevDeps);
  moveToDeps(changes.moveToDeps);

  // keep dependency sections sorted for stable diffs
  for (const section of ['dependencies', 'devDependencies']) {
    if (pkg[section]) {
      pkg[section] = Object.fromEntries(
        Object.entries(pkg[section]).sort(([a], [b]) => a.localeCompare(b)));
    }
  }
  if (pkg.dependencies && Object.keys(pkg.dependencies).length === 0) {
    delete pkg.dependencies; // empty section = noise
  }

  if (report.length) {
    console.log(`\n${label} (${wsDir === '.' ? 'package.json' : `${wsDir}/package.json`})`);
    for (const line of report) console.log(line);
  } else {
    console.log(`\n${label}: no changes`);
  }

  if (APPLY && report.length) {
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  }
}

console.log(APPLY ? 'APPLYING changes (--apply)\n' : 'DRY RUN (use --apply to write changes)\n');
applyToPackage('.', plan.root, 'root');
for (const [ws, changes] of Object.entries(plan.workspaces)) {
  applyToPackage(ws, changes, ws);
}
console.log(APPLY ? '\nDone. Next: npm install --package-lock-only --ignore-scripts && npm install' : '\nDry run only — nothing written.');
