const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations'
  });
  const [rows] = await conn.query('SELECT id, hearse_code, plate_number, status, branch_id, branch_name, branch_code, tenant_id, tenant_slug, fuel_card_number FROM hearses LIMIT 3');
  console.log(JSON.stringify(rows, null, 2));
  const [cnt] = await conn.query('SELECT COUNT(*) c FROM hearses');
  console.log('COUNT:', cnt[0].c);
  await conn.end();
})();
