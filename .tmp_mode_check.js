const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations' });
  const [m] = await conn.query('SELECT @@sql_mode, @@version');
  console.log(JSON.stringify(m, null, 2));
  // Does the invalid status "inactive" blow up?
  try {
    await conn.query("UPDATE hearses SET status='inactive' WHERE id=1");
    const [r] = await conn.query('SELECT status FROM hearses WHERE id=1');
    console.log('inactive accepted ->', JSON.stringify(r));
    await conn.query('UPDATE hearses SET status=? WHERE id=1', ['available']);
  } catch (e) { console.log('inactive REJECTED ->', e.code, e.message); }
  await conn.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
