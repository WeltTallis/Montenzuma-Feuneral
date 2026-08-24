const mysql = require('mysql2/promise');
(async () => {
    const c = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'restpoint_user', password: 'RestPointUser2024' });
    const [dbs] = await c.query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME LIKE '%support%'");
    console.log('DBs:', JSON.stringify(dbs));
    try {
        const [t] = await c.query('SELECT COUNT(*) AS n FROM support_db.support_tickets');
        console.log('tickets:', t[0].n);
        const [r] = await c.query('SELECT COUNT(*) AS n FROM support_db.ticket_replies');
        console.log('replies:', r[0].n);
        const [rows] = await c.query('SELECT ticket_id, subject, status, tenant_name FROM support_db.support_tickets ORDER BY ticket_id DESC LIMIT 5');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) { console.log('err:', e.message); }
    // Also check what the dashboard endpoint reads
    try {
        const [tt] = await c.query('SELECT COUNT(*) AS n FROM tenant_tracking.tenants');
        console.log('tenants in tenant_tracking:', tt[0].n);
    } catch (e) { console.log('tenants err:', e.message); }
    await c.end();
})();
