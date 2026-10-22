const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations'
  });
  const [rows] = await conn.query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='restpoint_operations' AND TABLE_NAME='hearses' AND COLUMN_NAME='fuel_card_number'");
  console.log(JSON.stringify(rows, null, 2));
  const [mig] = await conn.query("SELECT name, batch FROM knex_migrations_hearse WHERE name LIKE '%012%'");
  console.log('MIGRATION_ROW:', JSON.stringify(mig));
  await conn.end();
})();
