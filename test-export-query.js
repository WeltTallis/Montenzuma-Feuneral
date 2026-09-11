const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'restpoint_user', password: 'RestPointUser2024',
    database: 'monezuma-monalisa-feuneral-home'
  });
  const q = "SELECT d.deceased_id, d.full_name, d.admission_number, d.date_of_birth, d.date_of_death, " +
    "COALESCE(nk.full_name, d.relationship, '—') AS next_of_kin, d.burial_type AS service_type, " +
    "d.body_status, d.dispatch_date AS release_date, d.dispatch_date, d.date_admitted, d.created_at " +
    "FROM deceased d " +
    "LEFT JOIN next_of_kin nk ON nk.deceased_id = d.deceased_id AND nk.is_primary = 1 AND (nk.is_deleted IS NULL OR nk.is_deleted = 0) " +
    "ORDER BY d.created_at DESC LIMIT 5000";
  try {
    const [rows] = await conn.query(q);
    console.log('Query OK, rows:', rows.length);
    if (rows.length) console.log('first row:', JSON.stringify(rows[0]));
  } catch (e) {
    console.log('QUERY ERROR:', e.message);
  }
  await conn.end();
})().catch(e => console.log('ERR:', e.message));