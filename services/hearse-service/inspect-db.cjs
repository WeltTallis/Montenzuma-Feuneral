const mysql = require('mysql2/promise');
(async () => {
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1', port: 3306,
            user: 'restpoint_user', password: 'RestPointUser2024',
            database: 'restpoint_hearses', connectTimeout: 3000
        });
        const [cols] = await c.query('SHOW COLUMNS FROM hearses');
        console.log('HEARSES COLUMNS:');
        for (const r of cols) console.log(`  ${r.Field}: ${r.Type} nullable=${r.Null} default=${r.Default}`);
        const [h] = await c.query('SELECT id, hearse_code, hearse_name, plate_number, status, active_bookings FROM hearses ORDER BY id');
        console.log('\nHEARSES RECORDS:');
        for (const r of h) console.log(JSON.stringify(r));
        const [bookings] = await c.query('SELECT id, booking_code, hearse_id, client_name, destination, booking_dates, status, created_at FROM hearse_bookings ORDER BY id DESC LIMIT 30');
        console.log('\nLAST 30 BOOKINGS:');
        for (const r of bookings) console.log(JSON.stringify(r));
        // find double booked hearses
        const [dup] = await c.query(`SELECT hearse_id, COUNT(*) AS cnt FROM hearse_bookings WHERE status NOT IN ('completed','cancelled') GROUP BY hearse_id ORDER BY cnt DESC`);
        console.log('\nACTIVE BOOKINGS PER HEARSE:');
        for (const r of dup) console.log(JSON.stringify(r));
        await c.end();
    } catch (e) { console.log('ERR:', e.message); }
})();