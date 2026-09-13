#!/usr/bin/env node
/**
 * RestPoint dependency usage scanner.
 *
 * Scans every npm workspace (root + packages/* + services/* + shared +
 * FrontendClient/client) and reports, per workspace:
 *   - declared dependencies that are never imported anywhere (UNUSED)
 *   - declared dependencies only used by other workspaces (HOISTED - dead
 *     weight when declared in the root package.json)
 *   - modules imported but never declared (PHANTOM - works only because npm
 *     hoists another workspace's dep; breaks standalone installs)
 *   - usage detected via npm scripts (CLI binaries) and tsconfig "types"
 *
 * Usage:
 *   node scripts/scan-dependencies.mjs            # human-readable report
 *   node scripts/scan-dependencies.mjs --json     # machine-readable JSON
 */

import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';

const ROOT = path.resolve(import.meta.dirname, '..');
const REPORT_PATH = path.join(ROOT, 'scripts', 'dependency-report.json');

const SRC_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', 'coverage', '.git', '.github',
  '.vscode', 'logs', 'uploads', '.turbo', '.cache', 'temp-esb-check', 'nul-jsx',
]);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function walkSources(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      walkSources(full, out);
    } else if (SRC_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

/** Strip comments (best-effort) so commented-out imports don't count as usage. */
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // "//" not preceded by ":" (avoids eating "https://…" inside strings)
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const IMPORT_PATTERNS = [
  /\bimport\s+[^;'"]*?from\s*['"]([^'"]+)['"]/g,
  /\bexport\s+[^;'"]*?from\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bfrom\s*['"]([^'"]+)['"]/g,
];

function extractSpecifiers(code) {
  const clean = stripComments(code);
  const found = new Set();
  for (const re of IMPORT_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(clean)) !== null) found.add(m[1]);
  }
  return found;
}

/** Normalize an import specifier to a bare package name (or null). */
function toBarePackage(spec) {
  if (!spec) return null;
  if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('#')) return null;
  if (spec.startsWith('node:')) return null;
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    if (parts.length < 2) return null;
    return parts.slice(0, 2).join('/');
  }
  return spec.split('/')[0];
}

function isBuiltin(name) {
  if (name.startsWith('node:')) return true;
  return builtinModules.includes(name);
}

/** '@types/express' -> 'express', '@types/babel__core' -> '@babel/core' */
function typesTarget(depName) {
  if (!depName.startsWith('@types/')) return null;
  const t = depName.slice('@types/'.length);
  if (t.startsWith('__')) {
    const [scope, rest] = t.split('__');
    return `@${scope}/${rest}`;
  }
  return t;
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// workspace discovery
// ---------------------------------------------------------------------------

const workspaces = [];
function addWorkspace(key, dir, sourceRoots) {
  const pkg = readJson(path.join(ROOT, dir, 'package.json'));
  if (!pkg) return;
  workspaces.push({
    key,
    dir,
    name: pkg.name || key,
    deps: pkg.dependencies || {},
    devDeps: pkg.devDependencies || {},
    scripts: pkg.scripts || {},
    files: sourceRoots.flatMap((r) => walkSources(path.join(ROOT, dir, r))),
  });
}

addWorkspace('root', '.', ['src', 'scripts', 'types']);
for (const d of fs.readdirSync(path.join(ROOT, 'packages'), { withFileTypes: true })) {
  if (d.isDirectory()) addWorkspace(`packages/${d.name}`, `packages/${d.name}`, ['.']);
}
for (const d of fs.readdirSync(path.join(ROOT, 'services'), { withFileTypes: true })) {
  if (d.isDirectory()) addWorkspace(`services/${d.name}`, `services/${d.name}`, ['.']);
}
addWorkspace('shared', 'shared', ['.']);
addWorkspace('FrontendClient/client', 'FrontendClient/client', ['src', 'public', '.']);

const workspaceNames = new Map(workspaces.map((w) => [w.name, w.key]));

// ---------------------------------------------------------------------------
// collect module usage across the whole repo
// ---------------------------------------------------------------------------

// barePackage -> Set<workspace key>
const usage = new Map();
// barePackage -> workspace key -> [file]
const usageSites = new Map();

function record(base, wsKey, file) {
  if (!usage.has(base)) usage.set(base, new Set());
  usage.get(base).add(wsKey);
  if (!usageSites.has(base)) usageSites.set(base, new Map());
  const perWs = usageSites.get(base);
  if (!perWs.has(wsKey)) perWs.set(wsKey, []);
  perWs.get(wsKey).push(file);
}

for (const ws of workspaces) {
  for (const file of ws.files) {
    let code;
    try {
      code = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const spec of extractSpecifiers(code)) {
      const base = toBarePackage(spec);
      if (!base || isBuiltin(base)) continue;
      if (workspaceNames.has(base)) continue; // local workspace package
      record(base, ws.key, path.relative(ROOT, file));
    }
  }
}

// tsconfig "types" arrays count as usage (e.g. "types": ["node", "jest"])
const tsconfigTypes = new Map();
for (const ws of workspaces) {
  const found = new Set();
  for (const tsPath of [path.join(ROOT, ws.dir, 'tsconfig.json'), path.join(ROOT, 'tsconfig.base.json')]) {
    const ts = readJson(tsPath);
    const arr = ts?.compilerOptions?.types;
    if (Array.isArray(arr)) for (const t of arr) if (typeof t === 'string') found.add(t);
  }
  tsconfigTypes.set(ws.key, found);
}

// npm script tokens (CLI binaries like vite/tsc/nodemon/concurrently)
function scriptTokens(scripts) {
  const tokens = new Set();
  for (const cmd of Object.values(scripts)) {
    for (const tok of String(cmd).split(/[\s|&;<>()"'`]+/)) {
      if (tok) tokens.add(tok);
    }
  }
  return tokens;
}

function depBins(depName) {
  const pkg = readJson(path.join(ROOT, 'node_modules', depName, 'package.json'));
  const bins = [depName];
  if (pkg) {
    if (typeof pkg.bin === 'string') bins.push(pkg.bin);
    else if (pkg.bin && typeof pkg.bin === 'object') bins.push(...Object.keys(pkg.bin));
  }
  return [...new Set(bins.filter(Boolean))];
}

function binsUsedInScripts(dep, tokens) {
  return depBins(dep).some((b) => tokens.has(b));
}

// ---------------------------------------------------------------------------
// classify declared dependencies per workspace
// ---------------------------------------------------------------------------

const report = { generatedAt: new Date().toISOString(), workspaces: {} };

for (const ws of workspaces) {
  const tokens = scriptTokens(ws.scripts);
  const declared = Object.keys({ ...ws.deps, ...ws.devDeps });
  const deps = {
    used: [],             // imported by this workspace's source
    script: [],           // provides a CLI used in npm scripts
    types: [],            // @types/* backing an imported package / tsconfig types
    unusedEverywhere: [], // imported by nobody in the whole repo
    usedOnlyElsewhere: [], // imported only by other workspaces (dead weight here)
    phantom: [],          // imported here but not declared here
  };

  for (const dep of declared) {
    const users = usage.get(dep);
    if (users?.has(ws.key)) {
      deps.used.push(dep);
      continue;
    }
    if (binsUsedInScripts(dep, tokens)) {
      deps.script.push(dep);
      continue;
    }
    const target = typesTarget(dep);
    const typeUsed =
      (target && usage.get(target)?.has(ws.key)) ||
      tsconfigTypes.get(ws.key)?.has(dep.slice('@types/'.length));
    if (dep.startsWith('@types/') && typeUsed) {
      deps.types.push(dep);
      continue;
    }
    if (users && users.size > 0) {
      deps.usedOnlyElsewhere.push({ dep, usedBy: [...users] });
      continue;
    }
    deps.unusedEverywhere.push(dep);
  }

  // phantom detection: imported bases not declared in this workspace
  // (they resolve only thanks to npm hoisting of the root or sibling deps)
  const declaredSet = new Set(declared);
  for (const [base, perWs] of usageSites) {
    if (!perWs.has(ws.key)) continue;
    if (declaredSet.has(base)) continue;
    const providers = [];
    for (const w of workspaces) {
      if (w.deps[base] || w.devDeps[base]) providers.push(w.key);
    }
    if (providers.length === 0) providers.push('<not declared anywhere>');
    deps.phantom.push({ dep: base, providedBy: providers });
  }

  const sortAll = (o) => {
    for (const k of Object.keys(o)) {
      o[k] = (o[k] || []).sort((a, b) =>
        (typeof a === 'string' ? a : a.dep).localeCompare(typeof b === 'string' ? b : b.dep));
    }
    return o;
  };
  report.workspaces[ws.key] = {
    name: ws.name,
    sourceFiles: ws.files.length,
    ...sortAll(deps),
  };
}

// ---------------------------------------------------------------------------
// output
// ---------------------------------------------------------------------------

const json = process.argv.includes('--json');
if (json) {
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`JSON report written to ${path.relative(ROOT, REPORT_PATH)}`);
} else {
  for (const [key, info] of Object.entries(report.workspaces)) {
    const total =
      info.used.length + info.script.length + info.types.length +
      info.unusedEverywhere.length + info.usedOnlyElsewhere.length;
    console.log(`\n=== ${key} (${info.name}) — ${info.sourceFiles} source files, ${total} declared deps ===`);
    const list = (title, items, fmt = (x) => x) => {
      if (!items.length) return;
      console.log(`  ${title}:`);
      for (const it of items) console.log(`    - ${fmt(it)}`);
    };
    list('USED (imported)', info.used);
    list('SCRIPT (npm script CLI)', info.script);
    list('TYPES (@types)', info.types);
    list('!! UNUSED EVERYWHERE (candidates for removal)', info.unusedEverywhere);
    list('~ USED ONLY BY OTHER WORKSPACES (dead weight here)', info.usedOnlyElsewhere,
      (x) => `${x.dep}  <- used by: ${x.usedBy.join(', ')}`);
    list('PHANTOM (imported here, not declared here)', info.phantom,
      (x) => `${x.dep}  <- provided by: ${x.providedBy.join(', ')}`);
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n(JSON report also written to ${path.relative(ROOT, REPORT_PATH)})`);
}


