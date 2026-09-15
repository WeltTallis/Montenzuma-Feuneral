#!/usr/bin/env node
/**
 * check-relative-paths.mjs
 * ---------------------------------------------------------------------------
 * Catches unresolvable cross-directory relative require()/import before they
 * reach a container.
 *
 * Every service image runs with WORKDIR /usr/src/app, so the runtime layout is
 *
 *   /usr/src/app                       <- app root
 *   +-- packages/<pkg>/(dist|src)/...  <- @montezuma/* shared packages
 *   +-- shared/...                     <- shared runtime helpers (dbConfig, ...)
 *   +-- services/<svc>/...             <- one directory per service
 *
 * A file at  services/<svc>/<file>.js        must climb  '../..'
 * A file at  services/<svc>/<dir>/<file>.js  must climb  '../../..'
 *
 * One '../' too many silently walks OUT of the app root (e.g.
 * /usr/src/packages/...), and the process dies at require-time with
 *   Cannot find module '../../../packages/shared-utils/dist/timestamps'
 * which is exactly how documents-service crash-looped.
 *
 * Instead of guessing from directory depth (which false-positives on
 * in-service and frontend imports), every relative specifier is resolved
 * against the real filesystem using Node's resolution rules.
 *
 * Usage:  node scripts/check-relative-paths.mjs [--strict] [--list] [appRoot]
 *   --strict  also fail on specifiers that land inside the root but resolve to
 *             nothing (dead code / TS sources that compile away)
 *   --list    print every advisory entry instead of the first 15
 * Exit code 1 when a relative specifier climbs out of the app root (fatal).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Flags must not be mistaken for the optional app-root argument.
const args = process.argv.slice(2);
const appRoot = args.find((a) => !a.startsWith('--'));
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = appRoot ? path.resolve(appRoot) : path.resolve(SCRIPT_DIR, '..');

const EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.node'];
const SCAN_EXT = new Set(EXTENSIONS);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'release', 'coverage', '.git']);

// Relative specifiers only: require('./x') | from '../x' | import('../x')
const SPECIFIER_RE = /(?:require\s*\(\s*|from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\1/g;

/**
 * A specifier is ignored when it sits inside a comment, e.g. the JSDoc usage
 * examples repeated in shared/database.js and shared/connectionManager.js:
 *    *   import { connectionManager } from '../../shared/connectionManager';
 * Regex literals (which contain stray quotes such as [^'"] in SPECIFIER_RE)
 * make a full lexer unreliable, so this only asks: at this offset, is the
 * nearest preceding `/*` still unclosed, or is there a `//` earlier on the line?
 */
const isInComment = (src, index) => {
  const blockStart = src.lastIndexOf('/*', index);
  if (blockStart !== -1) {
    const blockEnd = src.indexOf('*/', blockStart + 2);
    if (blockEnd === -1 || blockEnd > index) return true;
  }

  const lineStart = src.lastIndexOf('\n', index) + 1;
  return src.slice(lineStart, index).includes('//');
};

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (SCAN_EXT.has(path.extname(entry.name)) && !entry.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
};

/** Node-style resolution: exact -> +ext -> /index+ext, plus the .js -> .ts
 *  rewrite that tsx applies to TypeScript sources (import './routes/x.js'
 *  resolving to x.ts). */
const resolves = (base) => {
  const candidates = [base];
  if (base.endsWith('.js')) {
    const stem = base.slice(0, -'.js'.length);
    candidates.push(`${stem}.ts`, `${stem}.tsx`);
  }

  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return true;
      if (fs.statSync(candidate).isDirectory()) {
        if (EXTENSIONS.some((ext) => fs.existsSync(path.join(candidate, `index${ext}`)))) return true;
        continue;
      }
    } catch {
      /* fall through to extension probing */
    }
    if (EXTENSIONS.some((ext) => fs.existsSync(candidate + ext))) return true;
  }
  return false;
};

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/**
 * Some trees are relocated by the Dockerfiles, so their relative depth in the
 * repo differs from the depth inside the image. Resolve those against the
 * image location, otherwise the checker reports correct code as broken
 * (services/configurations/sqlConfig/db.js uses '../../shared/config/db',
 * which is right once the Dockerfile copies it to /usr/src/app/configurations).
 */
const CONTAINER_REMAP = [
  { repo: 'services/configurations/', image: 'configurations/' },
];

const imageLocationOf = (file) => {
  const repoRel = rel(file);
  for (const { repo, image } of CONTAINER_REMAP) {
    if (repoRel.startsWith(repo)) return path.join(ROOT, image + repoRel.slice(repo.length));
  }
  return file;
};

const escapes = [];
const missing = [];

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(imageLocationOf(file));

  SPECIFIER_RE.lastIndex = 0;
  let m;
  while ((m = SPECIFIER_RE.exec(src)) !== null) {
    if (isInComment(src, m.index)) continue;

    const spec = m[2];
    const target = path.resolve(dir, spec);
    if (resolves(target)) continue;

    const record = {
      file: rel(file),
      line: src.slice(0, m.index).split('\n').length,
      spec,
      resolved: rel(target),
    };

    // Climbs out of the app root, or points at a file that simply is not there.
    if (rel(target).startsWith('../')) escapes.push(record);
    else missing.push(record);
  }
}

const LIST = process.argv.includes('--list');

const print = (title, rows, max = Infinity) => {
  console.log(`\n${title}: ${rows.length}`);
  for (const r of rows.slice(0, max)) {
    console.log(`  ${r.file}:${r.line}  ->  ${r.spec}`);
    console.log(`      resolved to ${r.resolved}  (nothing there)`);
  }
  if (rows.length > max) {
    console.log(`  ... ${rows.length - max} more (pass --list to print every entry)`);
  }
};

const STRICT = process.argv.includes('--strict');

console.log(`App root: ${ROOT}`);

if (!escapes.length && !missing.length) {
  console.log('✅ Every relative require/import resolves to a file on disk.');
  process.exit(0);
}

if (escapes.length) {
  print('❌ Escapes the app root (one "../" too many - fatal at require-time)', escapes);
  console.log('\nRule: a file N directories below the app root needs exactly N "../" segments.');
}

if (missing.length) {
  print(
    STRICT ? '❌ Points at a path that does not exist' : '⚠️  Points at a path that does not exist (advisory)',
    missing,
    LIST ? Infinity : 15
  );
  if (!STRICT) {
    console.log('   Mostly dead code and TypeScript sources that compile away; pass --strict to fail on these.');
  }
}

process.exit(escapes.length || (STRICT && missing.length) ? 1 : 0);