const m = require('mysql2/promise');
(async () => {
  const c = await m.createConnection({ host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations' });
  const [r] = await c.query('SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION', ['hearses']);
  r.forEach(x => console.log([x.COLUMN_NAME, x.COLUMN_TYPE, x.IS_NULLABLE, x.COLUMN_DEFAULT, x.EXTRA].join(' | ')));
  const [s] = await c.query('SELECT @@sql_mode AS sm, VERSION() AS v');
  console.log('SERVER:', JSON.stringify(s[0]));
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
