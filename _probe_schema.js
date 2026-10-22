const mysql = require('c:/Users/User/Downloads/restpoint/node_modules/mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'127.0.0.1',port:3306,user:'restpoint_user',password:'RestPointUser2024',database:'restpoint_operations'});
  const [cols] = await c.query('SHOW COLUMNS FROM hearses');
  console.log('COLUMNS:', cols.map(x=>x.Field).join(', '));
  console.log('HAS fuel_card_number:', cols.some(x=>x.Field==='fuel_card_number'));
  const [m] = await c.query('SELECT name FROM knex_migrations_hearse ORDER BY id');
  console.log('MIGRATIONS RUN:', m.map(x=>x.name).join(' | '));
  const [t] = await c.query('SHOW TABLES');
  console.log('TABLES:', t.map(x=>Object.values(x)[0]).join(', '));
  await c.end();
})().catch(e=>{console.error('ERR', e.message); process.exit(1);});
