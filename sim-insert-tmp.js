const mysql = require('mysql2/promise');
const { hasHearseColumn } = require('./services/hearse-service/dist/services/hearse-service/utilities/hearseSchema');

(async () => {
  const pool = await mysql.createPool({
    host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations', waitForConnections: true, connectionLimit: 5
  });

  const tenantId = '29da2a46-1178-4683-90f3-669a02d58661';
  const tenantSlug = 'monezuma-monalisa-feuneral-home-machakos';
  const now = new Date();

  // Case 1: empty fuel card -> omit column
  {
    const hearse_name = 'Test Hearse Empty Fuel';
    const plate_number = 'TEST-EMPTY-001';
    const model = '';
    const capacity = '8';
    const status = 'available';
    const fuel_card_number = '';
    const assignedBranchId = null;
    const branchNameValue = 'Main Branch';
    const branchCodeValue = 'MAIN';

    const [countResult] = await pool.query('SELECT COUNT(*) as count FROM hearses');
    const hearseNumber = String((countResult[0]?.count || 0) + 1).padStart(3, '0');
    const hearse_code = `HRS-${hearseNumber}`;

    const includeFuelCard = await hasHearseColumn('fuel_card_number');
    const insertFields = ['hearse_code', 'hearse_name', 'plate_number', 'model', 'capacity', 'status', 'branch_id', 'branch_name', 'branch_code', 'active_bookings', 'tenant_id', 'tenant_slug', ...(includeFuelCard ? ['fuel_card_number'] : []), 'created_at', 'updated_at'];
    const insertValues = [
      hearse_code, hearse_name || null, plate_number.trim(), model || null, capacity || 8, status || 'available',
      assignedBranchId, branchNameValue, branchCodeValue, 0, tenantId, tenantSlug, ...(includeFuelCard ? [fuel_card_number || null] : []), now, now
    ];
    const placeholders = insertValues.map(() => '?').join(', ');
    const escapedFields = insertFields.map(f => `\`${f}\``).join(', ');
    const query = `INSERT INTO hearses (${escapedFields}) VALUES (${placeholders})`;
    const [result] = await pool.query(query, insertValues);
    console.log('CASE1 (empty fuel) INSERT OK, insertId=', result.insertId, 'hearse_code=', hearse_code);

    const [rows] = await pool.query('SELECT id, hearse_code, plate_number, model, status, branch_id, branch_name, branch_code, tenant_id, tenant_slug, fuel_card_number FROM hearses WHERE id=?', [result.insertId]);
    console.log('CASE1 ROW:', JSON.stringify(rows[0]));
  }

  // Case 2: non-empty fuel card -> include column
  {
    const hearse_name = 'Test Hearse With Fuel';
    const plate_number = 'TEST-FUEL-002';
    const model = 'E-Class';
    const capacity = '8';
    const status = 'maintenance';
    const fuel_card_number = 'FC-12345';
    const assignedBranchId = null;
    const branchNameValue = 'Main Branch';
    const branchCodeValue = 'MAIN';

    const [countResult] = await pool.query('SELECT COUNT(*) as count FROM hearses');
    const hearseNumber = String((countResult[0]?.count || 0) + 1).padStart(3, '0');
    const hearse_code = `HRS-${hearseNumber}`;

    const includeFuelCard = await hasHearseColumn('fuel_card_number');
    const insertFields = ['hearse_code', 'hearse_name', 'plate_number', 'model', 'capacity', 'status', 'branch_id', 'branch_name', 'branch_code', 'active_bookings', 'tenant_id', 'tenant_slug', ...(includeFuelCard ? ['fuel_card_number'] : []), 'created_at', 'updated_at'];
    const insertValues = [
      hearse_code, hearse_name || null, plate_number.trim(), model || null, capacity || 8, status || 'available',
      assignedBranchId, branchNameValue, branchCodeValue, 0, tenantId, tenantSlug, ...(includeFuelCard ? [fuel_card_number || null] : []), now, now
    ];
    const placeholders = insertValues.map(() => '?').join(', ');
    const escapedFields = insertFields.map(f => `\`${f}\``).join(', ');
    const query = `INSERT INTO hearses (${escapedFields}) VALUES (${placeholders})`;
    const [result] = await pool.query(query, insertValues);
    console.log('CASE2 (with fuel) INSERT OK, insertId=', result.insertId, 'hearse_code=', hearse_code);

    const [rows] = await pool.query('SELECT id, hearse_code, plate_number, model, status, branch_id, branch_name, branch_code, tenant_id, tenant_slug, fuel_card_number FROM hearses WHERE id=?', [result.insertId]);
    console.log('CASE2 ROW:', JSON.stringify(rows[0]));
  }

  // Cleanup test rows
  const [del] = await pool.query("DELETE FROM hearses WHERE plate_number IN ('TEST-EMPTY-001','TEST-FUEL-002')");
  console.log('CLEANUP deleted:', del.affectedRows);

  await pool.end();
  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
