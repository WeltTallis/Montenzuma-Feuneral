#!/usr/bin/env node
/**
 * RestPoint multi-stage Dockerfile generator.
 *
 * Rewrites every services/<name>/Dockerfile from the old single-stage pattern
 * (build tools + ALL deps + full source + `chown -R` on everything = ~3GB per
 * image) into a 4-stage build:
 *
 *   deps      – full dependency tree (manifests only) for building shared pkgs
 *   build     – compiles packages/* dists (typescript) — never shipped
 *   prod-deps – production-only node_modules (--omit=dev, sharp optionals kept)
 *   runtime   – node:24-alpine + dumb-init + prod node_modules + built dists
 *               + runtime source, all owned via COPY --chown (NO chown -R
 *               layer, which alone was +504MB per image)
 *
 * Usage:
 *   node scripts/generate-dockerfiles.mjs            # write all Dockerfiles
 *   node scripts/generate-dockerfiles.mjs --dry-run  # print instead of write
 *
 * Per-service knobs live in SERVICES below. Regenerate after changing them.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DRY = process.argv.includes('--dry-run');

// npm install settings shared with the legacy Dockerfiles (slow-registry safe).
// --legacy-peer-deps is REQUIRED repo-wide: bullmq@5 declares peerOptional
// redis>=5 while this stack standardizes on redis@4.7.1 (socketio-service).
// The legacy leave-service Dockerfile already used this flag.
const NPM_SETTINGS = `npm config set fetch-timeout 1200000 \\
 && npm config set fetch-retries 5 \\
 && npm config set fetch-retry-mintimeout 120000 \\
 && npm config set fetch-retry-maxtimeout 600000`;
const INSTALL_ALL = `${NPM_SETTINGS} && npm install --legacy-peer-deps --no-audit --no-fund`;
// --no-fault: do NOT follow with `npm cache clean --force` here. Wiping the npm
// cache after every prod-deps install defeats tarball reuse on the brutally slow
// registry this repo targets (we measured ~9s/package → a full install is ~37m),
// which is exactly what made the prod deps stage flaky: a tarball fetch that
// 500'd after all retries got silently skipped by `--legacy-peer-deps` and npm
// still exited 0, shipping a node_modules that was MISSING express-rate-limit.
// The cache lives in the disposable prod-deps stage (/root/.npm) and is never
// COPY'd into the runtime image, so keeping it is free and strictly safer.
const INSTALL_PROD = `${NPM_SETTINGS} && npm install --omit=dev --legacy-peer-deps --no-audit --no-fund`;


// Shared packages build order (shared-config → shared-logger → shared-utils
// → shared-services → shared-stamps). Depends-on graph for closure expansion.
const SHARED_ORDER = ['shared-config', 'shared-logger', 'shared-utils', 'shared-services', 'shared-stamps'];
const SHARED_DEPS = {
  'shared-config': [],
  'shared-logger': [],
  'shared-utils': [],
  'shared-services': ['shared-config', 'shared-logger', 'shared-utils'],
  'shared-stamps': [],
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** Which shared packages does this service need built? (declared + closure) */
function sharedPkgsFor(serviceDir) {
  const pkg = readJson(path.join(ROOT, serviceDir, 'package.json'));
  const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    .filter((d) => d.startsWith('@montezuma/shared-'))
    .map((d) => d.replace('@montezuma/', ''));
  const needed = new Set(declared);
  // expand transitively (a package's own deps may need others built first)
  let grew = true;
  while (grew) {
    grew = false;
    for (const name of [...needed]) {
      for (const dep of SHARED_DEPS[name] || []) {
        if (!needed.has(dep)) {
          needed.add(dep);
          grew = true;
        }
      }
    }
  }
  // old Dockerfiles also built the classic four when the service pulled
  // shared code through app-global; keep the four as a floor for safety
  for (const base of ['shared-config', 'shared-logger', 'shared-utils', 'shared-services']) {
    needed.add(base);
  }
  return SHARED_ORDER.filter((n) => needed.has(n));
}

// ---------------------------------------------------------------------------
// Per-service configuration (derived from the legacy Dockerfiles)
// ---------------------------------------------------------------------------

const SERVICES = {
    'api-gateway': {
    cmd: ['node', 'services/api-gateway/server.js'],
    entrypoint: false,
    env: { RUNNING_IN_DOCKER: 'true' },
    extraDirs: [],
    healthPath: '/health',
    note: 'Plain-JS gateway. Needs built shared dists (requires them by path).',
    // server.js is plain CommonJS and require()s its deps from the ROOT
    // node_modules (hoisted by the prod-deps install). npm's --omit=dev
    // install in a partial workspace has been observed to silently skip
    // packages (e.g. express-rate-limit) and still exit 0 — shipping an
    // image that throws "Cannot find module 'express-rate-limit'" at boot.
    // Guard = fail the build HERE (mirrors socketio-service) instead of
    // silently shipping a broken gateway. Run from WORKDIR /usr/src/app so
    // the root hoisted tree is what gets validated (this is what server.js
    // resolves against at runtime).
    guard: `# GUARD (api-gateway): validate the root hoisted production deps.
# npm --omit=dev partial-workspace installs have been observed to silently
# SKIP packages (e.g. express-rate-limit), exiting 0 and shipping a node_modules
# that throws "Cannot find module" at boot. Fail the build HERE instead.
# Mirrors the socketio-service guard; runs in prod-deps WORKDIR (/usr/src/app)
# so it checks the same root tree server.js resolves against at runtime.
RUN node -e "['express-rate-limit','express','http-proxy-middleware','helmet','dotenv','cors','cookie-parser','hpp','express-async-handler'].forEach(p=>require.resolve(p)); console.log('[GUARD] api-gateway: root production deps OK')"`,
  },
  'analytics-service': {
    cmd: ['tsx', 'services/analytics-service/server.ts'],
    extraDirs: ['data'],
    healthPath: '/health',
  },
    'auth-service': {
    cmd: ['tsx', 'services/auth-service/server.ts'],
    extraDirs: ['data'],
    healthPath: '/health',
    // tsx runs server.ts via require() against deps hoisted into the root
    // node_modules by the prod-deps install; auth needs express@5 (which lives
    // under services/auth-service in the full tree) plus its own session/oauth
    // deps. Same silent-skip failure mode as the gateway — fail fast here.
    guard: `# GUARD (auth-service): validate production deps from the service dir
# (express@5 resolves under services/auth-service in the prod tree). npm
# --omit=dev partial-workspace installs can silently skip packages and
# exit 0 — fail the build HERE instead of shipping a broken auth service.
# Mirrors the socketio-service guard.
RUN cd services/auth-service && node -e "['express','express-rate-limit','express-session','helmet','hpp','cors','cookie-parser','dotenv','validator','bcryptjs','jsonwebtoken','redis','mysql2'].forEach(p=>require.resolve(p)); console.log('[GUARD] auth-service: production deps OK')"`,
  },
  'billing-service': {
    cmd: ['node', 'services/billing-service/server.js'],
    extraDirs: ['data', 'invoices'],
    healthPath: '/health',
  },
  'bodycheckout-service': {
    cmd: ['tsx', 'services/bodycheckout-service/server.ts'],
    extraDirs: ['data'],
    healthPath: '/health',
    note: 'Uses sharp — prod install keeps optional platform binaries (no --omit=optional).',
  },
  'chemical-service': {
    cmd: ['node', 'services/chemical-service/server.js'],
    extraDirs: ['data'],
    healthPath: '/health',
  },
  'coffin-service': {
    cmd: ['tsx', 'services/coffin-service/server.ts'],
    extraDirs: ['data'],
    hostDirs: ['/opt/storage/uploads'],
    healthPath: '/health',
  },
  'deceased-service': {
    cmd: ['tsx', 'services/deceased-service/server.ts'],
    extraDirs: ['services/deceased-service/uploads'],
    healthPath: '/health',
    note: 'Runs TS via tsx (server.ts entry). Needs shared-stamps dist.',
  },
  'documents-service': {
    cmd: ['node', 'services/documents-service/server.js'],
    extraDirs: ['uploads'],
    healthPath: '/health',
  },
  'extra-services': {
    cmd: ['node', 'services/extra-services/server.js'],
    extraDirs: ['data'],
    healthPath: '/health',
  },
  'florist-service': {
    cmd: ['tsx', 'services/florist-service/server.ts'],
    extraDirs: ['data'],
    hostDirs: ['/opt/storage/uploads'],
    env: { FLORIST_PORT: '5000' },
    healthPath: '/health',
  },
  'hearse-service': {
    cmd: ['tsx', 'services/hearse-service/server.js'], // plain JS but tsx-started historically
    extraDirs: ['services/hearse-service/uploads'],
    healthPath: '/health',
  },
  'invoice-service': {
    cmd: ['tsx', 'services/invoice-service/server.ts'],
    extraDirs: ['data'],
    healthPath: '/health',
  },
  'leave-service': {
    cmd: ['node', 'services/leave-service/server.js'],
    extraDirs: ['data'],
    healthPath: '/health',
    note: 'Plain-JS service (package.json main: server.js) — no tsx needed.',
  },
  'socketio-service': {
    cmd: ['tsx', 'services/socketio-service/server.ts'],
    extraDirs: ['data'],
    healthPath: '/health',
    guard: `# GUARD: this service hard-requires the redis client (Socket.IO Redis\n# adapter + notification REST store). Fail the build instead of shipping a\n# broken image (see legacy Dockerfile).\nRUN cd services/socketio-service && node -e "require('redis'); require('@socket.io/redis-adapter'); require('socket.io'); require('jsonwebtoken'); console.log('[GUARD] redis + @socket.io/redis-adapter + socket.io + jsonwebtoken OK')"`,
  },
  'store-service': {
    standalone: true, // own package.json, NOT part of the root workspace install
    cmd: ['tsx', 'server.ts'],
    workdir: '/usr/src/app/services/store-service',
    healthPath: '/health',
    healthCmd: `node -e "fetch('http://localhost:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" || exit 1`,
    note: 'Source uses .ts import specifiers (ESM+TS) → runs via tsx from source.',
  },
  'support-service': {
    cmd: ['sh', '-c', 'node services/support-service/init-db.js && node services/support-service/server.js'],
    extraDirs: ['uploads'],
    healthPath: '/health',
    note: 'Legacy Dockerfile used a quirky WORKDIR (/usr/src/app/support-service); normalized to /usr/src/app — the sh -c CMD paths are relative and still resolve.',
  },
  'tenant-service': {
    cmd: ['tsx', 'services/tenant-service/server.ts'],
    extraDirs: ['uploads'],
    healthPath: '/health',
  },
  'workshop-service': {
    cmd: ['tsx', 'services/workshop-service/server.ts'],
    port: 6969,
    extraDirs: ['data'],
    healthPath: '/api/health',
  },
};

// ---------------------------------------------------------------------------
// renderers
// ---------------------------------------------------------------------------

function manifestLines(svc, sharedPkgs) {
  return [
    'COPY package.json package-lock.json tsconfig.base.json ./',
    ...sharedPkgs.map((p) => `COPY packages/${p}/package.json ./packages/${p}/`),
    'COPY shared/package.json ./shared/',
    `COPY services/${svc}/package.json ./services/${svc}/`,
  ];
}

function buildRun(sharedPkgs) {
  const steps = sharedPkgs
    .map((p, i) => `${i === 0 ? '' : ' && \\\n    '}cd packages/${p} && npm run build && cd ../..`)
    .join('');
  return `# Build shared packages in dependency order (shared-config → shared-logger →\n# shared-utils → shared-services → shared-stamps). Only THIS stage needs the\n# dev toolchain (typescript); it is never shipped.\nRUN ${steps}`;
}

function header(svc, cfg) {
  const notes = cfg.note ? `\n# ${cfg.note}` : '';
  return `# syntax=docker/dockerfile:1
# ===========================================================================
# RestPoint ${svc} — multi-stage production image
# Generated by scripts/generate-dockerfiles.mjs — DO NOT EDIT BY HAND.
# Regenerate:  node scripts/generate-dockerfiles.mjs
#
# Why 4 stages: the legacy single-stage image shipped build tools (python3/
# make/g++), ALL devDependencies (typescript, nodemon, …), a global tsx, and a
# \`chown -R nodejs:nodejs /usr/src/app\` layer that duplicated the whole app
# (+504MB). This build only ships production node_modules + built shared
# package dists + runtime sources.${notes}
# ===========================================================================`;
}

function renderWorkspaceDockerfile(svc, cfg) {
  const sharedPkgs = sharedPkgsFor(`services/${svc}`);
  const port = cfg.port || 5000;
  const needsTsx = cfg.cmd[0] === 'tsx' || (cfg.cmd[0] === 'sh' && cfg.cmd.join(' ').includes('tsx'));
  const manifests = manifestLines(svc, sharedPkgs).map((l) => `${l}`).join('\n');
  const envLines = [
    'ENV NODE_ENV=production',
    `ENV PORT=${port}`,
    ...Object.entries(cfg.env || {}).map(([k, v]) => `ENV ${k}=${v}`),
  ].join('\n');
  const extraDirPaths = (cfg.extraDirs || []).map((d) => `/usr/src/app/${d}`);
  const mkdirTargets = [...extraDirPaths, ...(cfg.hostDirs || [])];
  const mkdirLine = mkdirTargets.length
    ? `\n# Writable runtime dirs (empty — tiny layer; uploads/data are bind-mounted\n# over these in compose). Ownership via chown on EMPTY dirs: never chown -R\n# over copied content, that duplicates the whole layer.\nRUN mkdir -p ${mkdirTargets.join(' ')} \\\n && chown -R nodejs:nodejs ${mkdirTargets.join(' ')}`
    : '';
  const health = `HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\\n  CMD wget --no-verbose --tries=1 --spider http://localhost:${port}${cfg.healthPath || '/health'} || exit 1`;
  const entry = cfg.entrypoint === false ? '' : '\nENTRYPOINT ["dumb-init", "--"]';

  return `${header(svc, cfg)}

# ---------------------------------------------------------------------------
# Stage 1/4 — deps: full dependency tree (incl. dev) just for building
# ---------------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /usr/src/app
# Do NOT use --omit=optional anywhere: it prunes sharp's platform binaries
# (@img/sharp-linuxmusl-x64 / @img/sharp-libvips-linuxmusl-x64) on Alpine.
ENV NODE_OPTIONS=--max-old-space-size=2048
${manifests}

RUN ${INSTALL_ALL}

# ---------------------------------------------------------------------------
# Stage 2/4 — build: compile shared package dists (discarded afterwards)
# ---------------------------------------------------------------------------
FROM deps AS build
COPY services/configurations/ ./configurations/
COPY packages/ ./packages/
COPY shared/ ./shared/
COPY services/app-global/ ./services/app-global/
COPY services/${svc}/ ./services/${svc}/

${buildRun(sharedPkgs)}

# ---------------------------------------------------------------------------
# Stage 3/4 — prod-deps: production-only node_modules (--omit=dev)
# ---------------------------------------------------------------------------
FROM node:24-alpine AS prod-deps
WORKDIR /usr/src/app
ENV NODE_OPTIONS=--max-old-space-size=2048
${manifests}

RUN ${INSTALL_PROD}
${cfg.guard ? `\n${cfg.guard}\n` : ''}
# ---------------------------------------------------------------------------
# Stage 4/4 — runtime: final image
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runtime

RUN apk add --no-cache dumb-init wget \\
 && addgroup -g 1001 -S nodejs \\
 && adduser -S nodejs -u 1001
${needsTsx ? '\n# tsx runs the TypeScript entry directly (same as the legacy images).\nRUN npm install -g tsx --no-audit --no-fund\n' : ''}
WORKDIR /usr/src/app

# Production-only dependency tree (dev toolchain excluded by --omit=dev)
COPY --from=prod-deps --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
# Shared packages incl. their built dist/ (relative @montezuma/* symlinks
# inside node_modules resolve against this path)
COPY --from=build --chown=nodejs:nodejs /usr/src/app/packages ./packages
# Runtime sources: TS files executed by tsx + JS services + shared modules
COPY --chown=nodejs:nodejs tsconfig.base.json ./
COPY --chown=nodejs:nodejs shared/ ./shared/
COPY --chown=nodejs:nodejs services/app-global/ ./services/app-global/
COPY --chown=nodejs:nodejs services/configurations/ ./configurations/
COPY --chown=nodejs:nodejs services/${svc}/ ./services/${svc}/
${mkdirLine}

USER nodejs

EXPOSE ${port}
${envLines}

${health}
${entry}
CMD ${JSON.stringify(cfg.cmd)}
`;
}

function renderStandaloneDockerfile(svc, cfg) {
  const port = cfg.port || 5000;
  const workdir = cfg.workdir || `/usr/src/app/services/${svc}`;
  const health = `HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \\\n  CMD ${cfg.healthCmd}`;
  return `${header(svc, cfg)}

# Self-contained service: NOT part of the root workspace install. It installs
# only its own package.json (no shared packages).

# ---------------------------------------------------------------------------
# Stage 1/3 — deps: full tree for any build tooling
# ---------------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR ${workdir}
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY services/${svc}/package.json ./

RUN ${INSTALL_ALL}

# ---------------------------------------------------------------------------
# Stage 2/3 — prod-deps: production-only node_modules
# ---------------------------------------------------------------------------
FROM node:24-alpine AS prod-deps
WORKDIR ${workdir}
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY services/${svc}/package.json ./

RUN ${INSTALL_PROD}

# ---------------------------------------------------------------------------
# Stage 3/3 — runtime
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runtime

RUN apk add --no-cache dumb-init wget \\
 && addgroup -g 1001 -S nodejs \\
 && adduser -S nodejs -u 1001

# tsx runs the TS entry from source (.ts import specifiers — see note above)
RUN npm install -g tsx --no-audit --no-fund

WORKDIR ${workdir}

COPY --from=prod-deps --chown=nodejs:nodejs ${workdir}/node_modules ./node_modules
COPY --chown=nodejs:nodejs services/${svc}/ ./

USER nodejs

EXPOSE ${port}
ENV NODE_ENV=production
ENV PORT=${port}

${health}

ENTRYPOINT ["dumb-init", "--"]
CMD ${JSON.stringify(cfg.cmd)}
`;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const serviceDirs = fs
  .readdirSync(path.join(ROOT, 'services'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(ROOT, 'services', d.name, 'Dockerfile')))
  .map((d) => d.name)
  .sort();

let written = 0;
for (const svc of serviceDirs) {
  const cfg = SERVICES[svc];
  if (!cfg) {
    console.error(`!! No generator config for services/${svc} — add it to SERVICES.`);
    process.exitCode = 1;
    continue;
  }
  const out = cfg.standalone
    ? renderStandaloneDockerfile(svc, cfg)
    : renderWorkspaceDockerfile(svc, cfg);
  const file = path.join(ROOT, 'services', svc, 'Dockerfile');
  if (DRY) {
    console.log(`--- ${file} (dry-run) ---`);
  } else {
    fs.writeFileSync(file, out);
    console.log(`wrote ${path.relative(ROOT, file)}`);
  }
  written++;
}
console.log(`\n${DRY ? 'checked' : 'generated'} ${written} Dockerfiles.`);



