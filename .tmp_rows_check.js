const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations' });
  const [rows] = await conn.query('SELECT id, hearse_code, plate_number, model, status, branch_id, branch_name, tenant_id FROM hearses ORDER BY id');
  console.log('--- hearses rows ---');
  console.log(JSON.stringify(rows, null, 2));
  const [dbs] = await conn.query('SHOW DATABASES');
  console.log('--- databases ---');
  console.log(dbs.map(d => Object.values(d)[0]).join(', '));
  await conn.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
