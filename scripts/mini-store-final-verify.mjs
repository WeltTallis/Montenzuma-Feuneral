// Final consolidated verification + cleanup
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const SECRET = 'RestPointJWTSecret2024ChangeMe!SuperSecureInProduction';
const base = 'http://localhost:5000/api/v1/restpoint/store';
const h = { Authorization: `Bearer ${jwt.sign({ id: 1, userId: 1, role: 'superadmin', name: 'Diagnostic', tenantId: 1, tenantSlug: 'montenzuma-monalisa-feuneral-machakos' }, SECRET, { expiresIn: '1h' })}`, 'Content-Type': 'application/json' };

// Clean any pre-existing orphans first
const c = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations', connectTimeout: 8000 });
const r = await c.query("DELETE FROM mini_store_transactions WHERE item_id NOT IN (SELECT id FROM mini_store_items)");
console.log('cleaned orphan transactions:', r[0].affectedRows);

// create -> refresh(persist check) -> delete
const name = `FinalVerify-${Date.now()}`;
const cr = await (await fetch(`${base}/items`, { method: 'POST', headers: h, body: JSON.stringify({ name, category: 'Diagnostics', unit: 'pcs', stock: 5, minStock: 2, staff: 'Tester' }) })).json();
console.log('CREATE ->', cr.success, 'id=', cr.data?.id);
const id = cr.data?.id;
const list = await (await fetch(`${base}/items`, { headers: h })).json();
console.log('REFRESH list ->', list.count, 'items, persisted:', list.data.some((i) => i.id === id) ? 'YES' : 'NO');
await fetch(`${base}/items/${id}`, { method: 'DELETE', headers: h });
console.log('DELETE -> done');
await c.end();

// final DB state
const c2 = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024', database: 'restpoint_operations', connectTimeout: 8000 });
const i = await c2.query("SELECT COUNT(*) AS n FROM mini_store_items");
const t = await c2.query("SELECT COUNT(*) AS n FROM mini_store_transactions");
console.log('FINAL mini_store_items:', i[0][0].n, '| mini_store_transactions:', t[0][0].n);
await c2.end();
process.exit(0);
