// Diagnostic: what data actually exists for the cases quoted in the bug report,
// vs. what the case-file drawer currently renders.
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:/new/restpoint/.env' });

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  });
  const [dbs] = await c.query('SHOW DATABASES');
  const q = (db, sql) => c.query(sql.replace(/\{db\}/g, '`' + db + '`'));

  for (const d of dbs) {
    const n = Object.values(d)[0];
    if (['information_schema', 'performance_schema', 'mysql', 'sys', 'test'].includes(n)) continue;
    const [t] = await c.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME='deceased'`, [n]);
    if (!t.length) continue;

    const [rows] = await q(n, `SELECT * FROM {db}.deceased WHERE full_name LIKE '%NYAMBURA%' OR full_name LIKE '%Orzavian%'`);
    if (!rows.length) continue;

    console.log('=== tenant: ' + n + ' ===');
    for (const r of rows) {
      const filled = {};
      const empty = [];
      for (const k of Object.keys(r)) {
        if (r[k] !== null && r[k] !== '' && r[k] !== undefined) filled[k] = r[k];
        else empty.push(k);
      }
      console.log('\n--- ' + r.full_name + ' (' + r.admission_number + ') ---');
      console.log('POPULATED:', JSON.stringify(filled, null, 1));
      console.log('EMPTY COLUMNS:', empty.join(', '));
    }

    const [br] = await q(n, `SELECT * FROM {db}.body_releases WHERE admission_number IN ('ADM-M/A01','M/A17')`);
    console.log('\n=== body_releases rows ===');
    console.log(br.length ? JSON.stringify(br, null, 1) : 'NONE');
    break;
  }
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
