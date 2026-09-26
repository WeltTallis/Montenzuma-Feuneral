#!/usr/bin/env node
'use strict';
/**
 * sql-param-audit
 * ================
 * Guards the fix for audit finding 2.4 (SQL injection in the analytics
 * controllers). For every `safeTenantQuery(dbName, `sql`, [params])` call it
 * asserts that:
 *
 *   1. the number of `?` placeholders in the SQL equals the number of supplied
 *      params (so no query is broken by a missing/extra binding), and
 *   2. no `${...}` template interpolation of a request-derived value survives
 *      anywhere inside the SQL string.
 *
 * Run:  node scripts/sql-param-audit.js services/analytics-service/controllers/*.ts
 * Exit code 1 if anything fails, so it can be wired into CI.
 */
const fs = require('fs');

const TICK = String.fromCharCode(96); // `

// Values that are safe to interpolate into SQL text: compile-time constants and
// things already validated against a closed set. Anything else is a finding.
const ALLOWED_INTERPOLATIONS = new Set(['dateFilter.sql']);

let total = 0;
let failures = 0;

/**
 * Hand-rolled scanner instead of a regex.
 *
 * The obvious `safeTenantQuery\(\s*dbName,\s*`([\s\S]*?)`\s*,\s*\[([^\]]*)\]`
 * pattern is O(n^2): the lazy group re-expands from every start position, and on
 * a ~30 KB controller that is hundreds of millions of steps — it hangs. This
 * walks the source once and is O(n).
 */
function findCalls(src) {
  const NEEDLE = 'safeTenantQuery(';
  const out = [];
  let from = 0;

  for (;;) {
    const start = src.indexOf(NEEDLE, from);
    if (start === -1) break;
    from = start + NEEDLE.length;

    // Skip whitespace, then require the `dbName,` first argument.
    let i = from;
    while (i < src.length && /\s/.test(src[i])) i += 1;
    if (!src.startsWith('dbName', i)) continue;
    i += 'dbName'.length;
    while (i < src.length && /\s/.test(src[i])) i += 1;
    if (src[i] !== ',') continue;
    i += 1;
    while (i < src.length && /\s/.test(src[i])) i += 1;

    if (src[i] !== TICK) continue;   // not a template literal -> ignore
    const sqlStart = i + 1;

    // Walk to the closing backtick, skipping `\`` escapes and `${ ... }` holes.
    i = sqlStart;
    let depth = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '\\') { i += 2; continue; }
      if (ch === '$' && src[i + 1] === '{') { depth += 1; i += 2; continue; }
      if (ch === '}' && depth > 0) { depth -= 1; i += 1; continue; }
      if (ch === TICK && depth === 0) break;
      i += 1;
    }
    if (i >= src.length) break;
    const sql = src.slice(sqlStart, i);
    const sqlEnd = i + 1;

    // Then the params array: `[ ... ]`, allowing nested brackets and strings.
    i = sqlEnd;
    while (i < src.length && /\s/.test(src[i])) i += 1;
    if (src[i] !== '[') continue;
    const arrStart = i;
    let brackets = 0;
    let quote = null;
    while (i < src.length) {
      const ch = src[i];
      if (quote) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === quote) quote = null;
        i += 1;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === TICK) { quote = ch; i += 1; continue; }
      if (ch === '[') brackets += 1;
      else if (ch === ']') { brackets -= 1; if (brackets === 0) break; }
      i += 1;
    }
    const params = src.slice(arrStart + 1, i).trim();
    out.push({ sql, params, line: src.slice(0, start).split('\n').length });
    from = i + 1;
  }
  return out;
}

for (const file of process.argv.slice(2)) {
  if (!fs.existsSync(file)) {
    console.log('MISSING  ' + file);
    failures += 1;
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  const calls = findCalls(src);

  console.log('\n== ' + file + ' (' + calls.length + ' calls) ==');
  for (const { sql, params, line } of calls) {
    total += 1;
    const placeholders = (sql.match(/\?/g) || []).length;

    // Expand `...filter.params` into the number of values that filter contributes,
    // counted from the placeholders inside the filter's own SQL.
    const spreadMatch = params.match(/\.\.\.(\w+)\.params/);
    let supplied;
    let note = '';

    if (spreadMatch) {
      const filterName = spreadMatch[1];
      const used = (sql.split('${' + filterName + '.sql}').length - 1);
      if (used === 0) {
        // The params were spread but the filter never appears in the SQL — this
        // is exactly the over-application bug the audit introduced; it would
        // make mysql2 throw "Incorrect arguments to mysqld_stmt_execute".
        note = 'spread-but-filter-unused';
        failures += 1;
        console.log('  FAIL line ' + String(line).padStart(4) + '  <' + note + '>');
        continue;
      }
      const literal = params
        .replace(/\.\.\.\w+\.params/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean).length;
      // Known contribution widths, verified against utils/sqlFilters.ts
      const WIDTH = { dateFilter: 2 };
      supplied = literal + (WIDTH[filterName] ?? 0) * used;
      if (WIDTH[filterName] === undefined) {
        note = 'unknown-filter:' + filterName;
      }
    } else {
      supplied = params === '' ? 0 : params.split(',').map((s) => s.trim()).filter(Boolean).length;
    }

    const interp = [...sql.matchAll(/\$\{([^}]+)\}/g)].map((x) => x[1]);
    const badInterp = interp.filter((n) => !ALLOWED_INTERPOLATIONS.has(n));

    const fail = placeholders !== supplied || badInterp.length > 0 || note.startsWith('unknown');
    if (fail) failures += 1;
    console.log(
      '  ' + (fail ? 'FAIL' : 'ok  ') + ' line ' + String(line).padStart(4) +
      '  ?=' + String(placeholders).padStart(2) +
      '  params=' + String(supplied).padStart(3) +
      (badInterp.length ? '  <raw interpolation: ' + badInterp.join(',') + '>' : '') +
      (note ? '  <' + note + '>' : '')
    );
  }
}

console.log('\nchecked ' + total + ' query call sites; ' + failures + ' problem(s)');
process.exit(failures === 0 ? 0 : 1);
