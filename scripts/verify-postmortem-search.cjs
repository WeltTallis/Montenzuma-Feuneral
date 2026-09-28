// Proves the full fix on a CLONE of a real, schema-divergent tenant DB.
//   [1][2] route fix only  -> HTTP 200, record returned, `age` degraded to null
//        (this exact request returned 500 before the fix)
//   [3][4] after migration -> HTTP 200, `age` populated
// The temp database is dropped at the end; real tenant data is never touched.
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', target: 'ES2020', esModuleInterop: true, skipLibCheck: true },
});

const express = require('express');
const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:/new/restpoint/.env' });

const router = require('../services/deceased-service/routes/deceasedRoutes').default;
const SRC = 'abigael_funeral_home';   // real tenant missing age/phone_number/signature
const TMP = 'zz_postmortem_verify_tmp';

const columnsOf = async (conn, schema, table) => {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?`,
    [schema, table]);
  return new Set(rows.map(r => String(r.COLUMN_NAME).toLowerCase()));
};

// Seed every NOT NULL column (this legacy table declares several without defaults).
const seedDeceased = async (conn, schema) => {
  const [meta] = await conn.query(
    `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA=? AND TABLE_NAME='deceased' AND IS_NULLABLE='NO'`, [schema]);
  const seed = {};
  for (const m of meta) {
    const c = String(m.COLUMN_NAME).toLowerCase();
    const t = String(m.DATA_TYPE).toLowerCase();
    if (c === 'deceased_id') seed[c] = 'D-TEST-1';
    else if (c === 'admission_number') seed[c] = 'F/A20';
    else if (c === 'full_name') seed[c] = 'Test Deceased';
    else if (c === 'gender') seed[c] = 'Male';
    else if (/int|decimal|float|double/.test(t)) seed[c] = 0;
    else if (/date|time|year/.test(t)) seed[c] = '2000-01-01';
    else if (/enum/.test(t)) {
      const [d] = await conn.query(
        `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA=? AND TABLE_NAME='deceased' AND COLUMN_NAME=?`, [schema, m.COLUMN_NAME]);
      const f = /enum\((.*)\)/i.exec(String(d[0].COLUMN_TYPE));
      seed[c] = f ? f[1].split(',')[0].trim().replace(/^'|'$/g, '') : '';
    } else seed[c] = '';
  }
  await conn.query(
    `INSERT INTO \`${schema}\`.deceased (${Object.keys(seed).map(k => `\`${k}\``).join(',')})
     VALUES (${Object.keys(seed).map(() => '?').join(',')})`, Object.values(seed));
};

module.exports = { router, SRC, TMP, columnsOf, seedDeceased };

// ─── Test driver ──────────────────────────────────────────────────────────────
(async () => {
  const app = express();
  app.use(express.json());
  app.use('/deceased', router);
  const srv = http.createServer(app);
  await new Promise(r => srv.listen(0, r));
  const port = srv.address().port;

  const get = (qs, slug) => new Promise(resolve => {
    http.get({ port, path: `/deceased/public/postmortem/search?${qs}`, headers: { 'x-tenant-slug': slug } },
      r => { let b = ''; r.on('data', c => b += c); r.on('end', () => resolve({ status: r.statusCode, body: b })); })
      .on('error', e => resolve({ status: 0, body: e.message }));
  });

  const show = (label, r) => {
    let p = {}; try { p = JSON.parse(r.body); } catch {}
    const d = (p.data && p.data.deceased) || {};
    console.log(`${label}\n  HTTP ${r.status}  ${p.message || ''}` +
      `\n  deceased_id=${JSON.stringify(d.deceased_id)} full_name=${JSON.stringify(d.full_name)}` +
      `\n  age=${JSON.stringify(d.age)} signature=${JSON.stringify(d.signature)}` +
      ` next_of_kin=${JSON.stringify(d.next_of_kin_name)}`);
  };

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  });

  // Clone the broken tenant schema (structure only, no data).
  await conn.query(`DROP DATABASE IF EXISTS \`${TMP}\``);
  await conn.query(`CREATE DATABASE \`${TMP}\``);
  for (const t of ['deceased', 'next_of_kin', 'postmortem']) {
    await conn.query(`CREATE TABLE \`${TMP}\`.\`${t}\` LIKE \`${SRC}\`.\`${t}\``);
  }
  await seedDeceased(conn, TMP);

  const nokCols = await columnsOf(conn, TMP, 'next_of_kin');
  const nok = { deceased_id: 'D-TEST-1', full_name: 'Kin Person', relationship: 'Son', contact: '0700000000' };
  for (const k of Object.keys(nok)) if (!nokCols.has(k)) delete nok[k];
  await conn.query(
    `INSERT INTO \`${TMP}\`.next_of_kin (${Object.keys(nok).map(k => `\`${k}\``).join(',')})
     VALUES (${Object.keys(nok).map(() => '?').join(',')})`, Object.values(nok));

  const dCols = await columnsOf(conn, TMP, 'deceased');
  console.log(`cloned ${SRC} -> ${TMP}`);
  console.log(`  deceased missing: ${['age','phone_number','signature'].filter(c=>!dCols.has(c)).join(', ') || 'none'}`);
  console.log(`  nok missing:      ${['signature','is_primary'].filter(c=>!nokCols.has(c)).join(', ') || 'none'}\n`);

  // The exact production request from the bug report, plus a phone lookup.
  show('[1] admission_number search, route fix only:', await get('admission_number=F%2FA20', TMP));
  show('[2] phone search, route fix only:',            await get('phone=0700000000', TMP));

  // ── PDF endpoint data queries, BEFORE the migration ────────────────────
  // (table names are schema-qualified here only because this test connection
  // has no default database; the app's tenant pool supplies it.)
  const { pickAs } = require('../services/deceased-service/utils/tenantSchema');
  const pdfCheck = async (label) => {
    const cols = await columnsOf(conn, TMP, 'deceased');
    const ncols = await columnsOf(conn, TMP, 'next_of_kin');
    try {
      const dq = `SELECT ${['full_name','date_of_death','signature','admission_number',
                           'date_of_birth','age','gender','place_of_death','national_id']
                          .map(c => pickAs(cols, c, c)).join(', ')} FROM \`${TMP}\`.deceased WHERE deceased_id = ?`;
      const [d] = await conn.query(dq, ['D-TEST-1']);
      const where = ['deceased_id = ?'];
      if (ncols.has('is_primary')) where.push('is_primary = 1');
      if (ncols.has('is_deleted')) where.push('is_deleted = 0');
      const kq = `SELECT ${['full_name','relationship','contact']
                     .map(c => pickAs(ncols, c, c)).join(', ')} FROM \`${TMP}\`.next_of_kin WHERE ${where.join(' AND ')} LIMIT 1`;
      const [k] = await conn.query(kq, ['D-TEST-1']);
      console.log(`${label}\n  PDF deceased query: ok  full_name=${JSON.stringify(d[0]?.full_name)}` +
                  ` age=${JSON.stringify(d[0]?.age)}` +
                  `\n  PDF next_of_kin query: ok  kin=${JSON.stringify(k[0]?.full_name)}`);
    } catch (e) {
      console.log(`${label}\n  PDF query THREW: ${e.code} ${e.message}`);
    }
  };
  await pdfCheck('[2b] PDF data queries, route fix only (no migration):');

  // Prove the OLD hardcoded list really does fail on this schema.
  try {
    await conn.query(
      `SELECT full_name, date_of_death, signature, admission_number, date_of_birth,
              age, gender, place_of_death, national_id FROM \`${TMP}\`.deceased WHERE deceased_id = ?`,
      ['D-TEST-1']);
    console.log('\n[2c] old hardcoded PDF list: unexpectedly succeeded');
  } catch (e) {
    console.log(`[2c] old hardcoded PDF list threw: ${e.code} ${e.message}`);
  }

  // Apply the new migration, then repeat.
  const ts = require('typescript');
  const fs = require('fs');
  const src = fs.readFileSync('shared/services/all-service-migrations.ts', 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out)(mod, mod.exports, require);
  const mig = mod.exports.ALL_TENANT_MIGRATIONS.find(x => x.name === '016_public_postmortem_schema_parity');
  if (!mig) throw new Error('migration 016 not registered');
  await conn.query(`USE \`${TMP}\``);
  for (const stmt of mig.sql.split(';').map(s => s.trim()).filter(Boolean)) await conn.query(stmt);

  show('\n[3] admission_number search, after migration:', await get('admission_number=F%2FA20', TMP));
  show('[4] phone search, after migration:',            await get('phone=0700000000', TMP));

  await pdfCheck('[5] PDF data queries, after migration:');

  await conn.query(`DROP DATABASE \`${TMP}\``);
  console.log('\ntemp database dropped.');
  await conn.end();
  srv.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
