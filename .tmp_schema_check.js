const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations' });
  const [cols] = await conn.query('SHOW COLUMNS FROM hearses');
  console.log('--- hearses columns ---');
  console.log(cols.map(c => `${c.Field} | ${c.Type} | null=${c.Null} | default=${c.Default}`).join('\n'));
  const [mig] = await conn.query('SELECT name, batch FROM knex_migrations_hearse ORDER BY id');
  console.log('--- knex_migrations_hearse ---');
  console.log(mig.map(m => `${m.name} (batch ${m.batch})`).join('\n'));
  await conn.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
