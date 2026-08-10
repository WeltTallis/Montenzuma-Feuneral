// ============================================
// LIVE DUPLICATE-BOOKING DIAGNOSTICS (READ-ONLY)
// ============================================
// Reports, per hearse + date, how many ACTIVE bookings overlap that date.
// The new multi-day conflict rule (enforced atomically at submit time) prevents
// new duplicates from ever being created. This script just reports what already
// exists in the live database so you can decide how to clean it up.
//
// Run:  node live-chk.cjs
const mysql = require('mysql2/promise');
const hearseAvailability = require('./dist/services/hearse-service/utilities/hearseAvailability.js');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'restpoint_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'RestPointUser2024';
const DB_NAME = process.env.HEARSE_DB_NAME || 'restpoint_hearses';

(async () => {
    const c = await mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME });
    console.log('Connected to', DB_NAME);

    const [hearses] = await c.query('SELECT id, hearse_code, hearse_name, plate_number, status FROM hearses ORDER BY id');
    const [bookings] = await c.query("SELECT * FROM hearse_bookings WHERE status NOT IN ('completed', 'cancelled')");
    const [all] = await c.query('SELECT * FROM hearse_bookings');

    console.log('\n=== HEARSES ===');
    for (const h of hearses) console.log(`  #${h.id} ${h.hearse_name || h.hearse_code} ${h.plate_number} status=${h.status}`);

    console.log('\n=== ACTIVE BOOKINGS: date coverage per hearse ===');
    const perDate = new Map(); // key `${hearse_id}|${date}` -> { ids, codes }
    const hearingIds = new Set(hearses.map(h => h.id));
    for (const b of bookings) {
        if (!hearingIds.has(b.hearse_id)) continue;
        for (const d of hearseAvailability.extractRowDates(b)) {
            const key = `${b.hearse_id}|${d}`;
            if (!perDate.has(key)) perDate.set(key, []);
            perDate.get(key).push({ id: b.id, code: b.booking_code, status: b.status });
        }
    }

    let duplicateDates = 0;
    for (const [key, list] of [...perDate.entries()].sort()) {
        if (list.length > 1) {
            duplicateDates++;
            console.log(`  OVERLAP  hearse ${key.split('|')[0]} on ${key.split('|')[1]}: ${list.length} bookings -> ${list.map(x => `${x.code}(id:${x.id})`).join(', ')}`);
        }
    }
    if (duplicateDates === 0) console.log('  (none)');

    console.log('\n=== AVAILABILITY PRE-CHECK (new logic, against live data) ===');
    async function checkAvailability(hearseId, reqDates) {
        const [hearse] = await c.query('SELECT id, status, hearse_name, plate_number FROM hearses WHERE id = ?', [hearseId]);
        if (!hearse[0]) return { available: false, message: 'not found' };
        const { dates, conflicts: dc } = hearseAvailability.validateRequestedDates(reqDates);
        if (dc.length) return { available: false, conflicts: dc };
        const [rows] = await c.query("SELECT * FROM hearse_bookings WHERE hearse_id = ? AND status NOT IN ('completed', 'cancelled')", [hearseId]);
        const bookedSet = new Set();
        for (const r of rows) for (const d of hearseAvailability.extractRowDates(r)) bookedSet.add(d);
        const conflicts = hearseAvailability.computeDateConflicts(dates, [...bookedSet]).map(d => ({ date: d }));
        return {
            available: conflicts.length === 0,
            hearse: `${hearse[0].hearse_name || hearse[0].hearse_code} (#${hearseId})`,
            conflicts,
            message: conflicts.length ? `already booked on ${conflicts.map(x => x.date).join(', ')}` : 'available for all requested dates'
        };
    }

    // hearse 2 currently has 4 active bookings on 2026-08-10 (the reported bug)
    const r1 = await checkAvailability(2, ['2026-08-10']);
    console.log(`  Request hearse 2 [2026-08-10]   -> available=${r1.available} conflicts=${JSON.stringify(r1.conflicts)}`);
    const r2 = await checkAvailability(2, ['2026-08-20']);
    console.log(`  Request hearse 2 [2026-08-20]   -> available=${r2.available} conflicts=${JSON.stringify(r2.conflicts)} (future free date)`);
    const r3 = await checkAvailability(2, ['2026-08-10', '2026-08-20']);
    console.log(`  Request hearse 2 [08-10,08-20]  -> available=${r3.available} conflicts=${JSON.stringify(r3.conflicts)}`);
    const r4 = await checkAvailability(1, ['2026-08-08']);
    console.log(`  Request hearse 1 [2026-08-08]   -> available=${r4.available} conflicts=${JSON.stringify(r4.conflicts)}`);

    console.log('\n=== TOTALS ===');
    console.log('  Active bookings total :', bookings.length);
    console.log('  All-time bookings     :', all.length);
    console.log('  Dates double-booked   :', duplicateDates);

    await c.end();
})().catch((e) => { console.error(e); process.exit(1); });