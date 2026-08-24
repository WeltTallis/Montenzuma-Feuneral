
// MULTI-DAY HEARSE BOOKING TEST SUITE

// Covers every scenario from the multi-day booking specification.
//   Test 1  : three-day booking                     -> SUCCESS
//   Test 2  : exact duplicate                       -> 409
//   Test 3  : overlap first day                     -> 409 (conflict 10)
//   Test 4  : overlap middle day                    -> 409 (conflict 11)
//   Test 5  : overlap last day                      -> 409 (conflict 12)
//   Test 6  : completely different dates            -> AVAILABLE
//   Test 7  : multiple overlaps                     -> 409 (conflicts 10,12,15)
//   Test 8  : different hearse                      -> AVAILABLE
//   Test 9  : concurrent multi-day booking          -> exactly ONE succeeds
//
// Integration tests run against a SCRATCH database `restpoint_hearses_test`
// (created/dropped by this script) so the live data is never touched.

const mysql = require('mysql2/promise');
const hearseAvailability = require('./utilities/hearseAvailability');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'restpoint_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'RestPointUser2024';
const TEST_DB = 'restpoint_hearses_test';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, details) {
    if (condition) {
        passed++;
        console.log(`  PASS ${name}`);
    } else {
        failed++;
        failures.push({ name, details });
        console.log(`  FAIL ${name}${details ? '  -> ' + details : ''}`);
    }
}

async function ensureTestDb() {
    const root = await mysql.createConnection({
        host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD
    });
    await root.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
    await root.query(`CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await root.end();

    const c = await mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: TEST_DB });
    await c.query(`CREATE TABLE hearses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hearse_code VARCHAR(50) NULL,
        hearse_name VARCHAR(100) NULL,
        plate_number VARCHAR(50) NULL,
        status VARCHAR(50) DEFAULT 'available',
        active_bookings INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    await c.query(`CREATE TABLE hearse_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_code VARCHAR(50) UNIQUE NULL,
        hearse_id INT NULL,
        tenant_db_name VARCHAR(100) NULL,
        client_name VARCHAR(200) NULL,
        client_phone VARCHAR(50) NULL,
        destination TEXT NULL,
        from_location VARCHAR(255) NULL,
        to_location VARCHAR(255) NULL,
        booking_dates LONGTEXT NULL,
        booking_date DATETIME NULL,
        from_timestamp DATETIME NULL,
        to_timestamp DATETIME NULL,
        event_date DATE NULL,
        status VARCHAR(50) DEFAULT 'booked',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    await c.query(`INSERT INTO hearses (id, hearse_code, hearse_name, plate_number, status) VALUES
        (1, 'HRS-001', 'H1', 'KCA 1', 'booked'),
        (2, 'HRS-002', 'H2', 'KCA 2', 'available'),
        (3, 'HRS-003', 'H3', 'KCA 3', 'available')`);
    await c.end();
}

let pool = null;

async function getPool() {
    if (!pool) {
        pool = await mysql.createPool({
            host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD,
            database: TEST_DB, waitForConnections: true, connectionLimit: 10
        });
    }
    return pool;
}

let bookingSeq = 1000;

/**
 * Replicates the makeHearseBooking + attemptHearseReservation transaction
 * EXACTLY as the controller does (same ordering, same FOR UPDATE locks).
 */
async function bookHearse(hearseId, dates, clientName = 'Test Client') {
    const conn = await pool.getConnection();
    const outcome = { ok: false, statusCode: 0, conflicts: [], conflictDate: null };
    try {
        await conn.beginTransaction();
        const reservation = await hearseAvailability.attemptHearseReservation(conn, hearseId, dates);

        if (reservation.ok === false && reservation.notFound) {
            await conn.rollback();
            outcome.statusCode = 404;
            return outcome;
        }
        if (reservation.ok === false) {
            await conn.rollback();
            outcome.statusCode = 409;
            outcome.conflicts = reservation.conflicts.map((cc) => cc.date);
            outcome.conflictDate = reservation.conflictDate;
            return outcome;
        }

        bookingSeq++;
        const code = `BK-TEST-${bookingSeq}`;
        await conn.query(
            `INSERT INTO hearse_bookings
             (booking_code, hearse_id, tenant_db_name, client_name, client_phone, destination,
              from_location, to_location, booking_dates, status, created_at, updated_at)
             VALUES (?, ?, 'test', ?, '0700000000', 'TEST ROUTE', 'NAIROBI', 'MASSI', ?, 'booked', NOW(), NOW())`,
            [code, hearseId, clientName, JSON.stringify(dates)]
        );
        await conn.query(
            'UPDATE hearses SET status = ?, active_bookings = ?, updated_at = NOW() WHERE id = ?',
            ['booked', 1, hearseId]
        );
        await conn.commit();
        outcome.ok = true;
        outcome.statusCode = 201;
        return outcome;
    } catch (error) {
        try { await conn.rollback(); } catch { /* noop */ }
        throw error;
    } finally {
        conn.release();
    }
}

async function runUnitTests() {
    console.log('\n--- Unit tests: pure availability functions ---');

    // toDateKey
    check('toDateKey: plain date', hearseAvailability.toDateKey('2026-08-10') === '2026-08-10');
    check('toDateKey: ISO datetime', hearseAvailability.toDateKey('2026-08-10T00:00:00') === '2026-08-10');
    check('toDateKey: SQL datetime', hearseAvailability.toDateKey('2026-08-10 07:30:00') === '2026-08-10');
    check('toDateKey: slashes', hearseAvailability.toDateKey('2026/08/10') === '2026-08-10');
    check('toDateKey: invalid', hearseAvailability.toDateKey('2026-13-99') === null);
    check('toDateKey: 2026-02-30 rejected', hearseAvailability.toDateKey('2026-02-30') === null);

    // isValidDateKey
    check('isValidDateKey: good', hearseAvailability.isValidDateKey('2026-08-10') === true);
    check('isValidDateKey: bad', hearseAvailability.isValidDateKey('2026-02-30') === false);

    // expandDateRange (start/end columns expansion - every day occupied)
    check('expandDateRange: 3 days', JSON.stringify(hearseAvailability.expandDateRange('2026-08-10', '2026-08-12')) === JSON.stringify(['2026-08-10', '2026-08-11', '2026-08-12']));

    // normalizeBookingDates - all stored representations
    check('normalize: JSON array string', JSON.stringify(hearseAvailability.normalizeBookingDates('["2026-08-10","2026-08-11"]')) === JSON.stringify(['2026-08-10', '2026-08-11']));
    check('normalize: JS array of strings', JSON.stringify(hearseAvailability.normalizeBookingDates(['2026-08-10', '2026-08-12'])) === JSON.stringify(['2026-08-10', '2026-08-12']));
    check('normalize: array of objects', JSON.stringify(hearseAvailability.normalizeBookingDates([{ date: '2026-08-10' }, { date: '2026-08-11' }])) === JSON.stringify(['2026-08-10', '2026-08-11']));
    check('normalize: start/end columns', JSON.stringify(hearseAvailability.normalizeBookingDates({ start_date: '2026-08-10', end_date: '2026-08-12' })) === JSON.stringify(['2026-08-10', '2026-08-11', '2026-08-12']));
    check('normalize: single booking_date', JSON.stringify(hearseAvailability.normalizeBookingDates({ booking_date: '2026-08-10 09:00:00' })) === JSON.stringify(['2026-08-10']));
    check('normalize: from/to timestamps range', JSON.stringify(hearseAvailability.normalizeBookingDates({ from_timestamp: '2026-08-10 08:00:00', to_timestamp: '2026-08-11 16:00:00' })) === JSON.stringify(['2026-08-10', '2026-08-11']));
    check('normalize: dedupes', JSON.stringify(hearseAvailability.normalizeBookingDates(['2026-08-10', '2026-08-10', '2026-08-11'])) === JSON.stringify(['2026-08-10', '2026-08-11']));

    // computeDateConflicts scenarios from the spec
    const ex1 = ['2026-08-10', '2026-08-11', '2026-08-12'];
    check('conflict: same first date', JSON.stringify(hearseAvailability.computeDateConflicts(['2026-08-10', '2026-08-13'], ex1)) === JSON.stringify(['2026-08-10']));
    check('conflict: same middle date', JSON.stringify(hearseAvailability.computeDateConflicts(['2026-08-11', '2026-08-13'], ex1)) === JSON.stringify(['2026-08-11']));
    check('conflict: same last date', JSON.stringify(hearseAvailability.computeDateConflicts(['2026-08-13', '2026-08-12'], ex1)) === JSON.stringify(['2026-08-12']));
    check('conflict: no overlap', JSON.stringify(hearseAvailability.computeDateConflicts(['2026-08-13', '2026-08-14', '2026-08-15'], ex1)) === JSON.stringify([]));
    const ex7 = ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-15'];
    check('conflict: multiple overlaps', JSON.stringify(hearseAvailability.computeDateConflicts(['2026-08-09', '2026-08-10', '2026-08-12', '2026-08-15', '2026-08-16'], ex7)) === JSON.stringify(['2026-08-10', '2026-08-12', '2026-08-15']));

    // validateRequestedDates
    const vr = hearseAvailability.validateRequestedDates(['2026-08-10', '2026-02-30'], '2026-08-11');
    check('validate: past date rejected', vr.conflicts.some((c) => c.date === '2026-08-10' && c.reason === 'past_date'));
    check('validate: invalid date rejected', vr.conflicts.some((c) => c.date === '2026-02-30' && c.reason === 'invalid_date'));
    const vr2 = hearseAvailability.validateRequestedDates(['2026-08-12'], '2026-08-11');
    check('validate: valid future date accepted', vr2.conflicts.length === 0 && vr2.dates[0] === '2026-08-12');
}

async function storedDatesEqual(hearseId, expected) {
    const [rows] = await pool.query(
        "SELECT booking_dates FROM hearse_bookings WHERE hearse_id = ? AND status NOT IN ('completed', 'cancelled') ORDER BY id ASC",
        [hearseId]
    );
    if (!rows || rows.length === 0) return false;
    const lastRow = rows[rows.length - 1];
    let dates = [];
    try { dates = JSON.parse(lastRow.booking_dates || '[]'); } catch { dates = []; }
    return JSON.stringify(dates.slice().sort()) === JSON.stringify(expected.slice().sort());
}
async function runIntegrationTests() {
    // ensureTestDb already created the schema + seeded hearses
    pool = await getPool();
    bookingSeq = 1000;

    console.log('\n--- Integration tests: live transactions on scratch DB ---');

    // Test 1 — three-day booking
    const t1 = await bookHearse(2, ['2026-08-10', '2026-08-11', '2026-08-12']);
    check('Test 1 — three-day booking (10/11/12) SUCCESS', t1.statusCode === 201, `got ${t1.statusCode}`);
    check('Test 1 — booking_dates stored for ALL 3 dates', await storedDatesEqual(2, ['2026-08-10', '2026-08-11', '2026-08-12']));

    // Test 2 — exact duplicate
    const t2 = await bookHearse(2, ['2026-08-10', '2026-08-11', '2026-08-12']);
    check('Test 2 — exact duplicate 409', t2.statusCode === 409, `got ${t2.statusCode}`);

    // Test 3 — overlap first day
    const t3 = await bookHearse(2, ['2026-08-10', '2026-08-13']);
    check('Test 3 — overlap first day 409', t3.statusCode === 409, `got ${t3.statusCode}`);
    check('Test 3 — conflict date is 2026-08-10', JSON.stringify(t3.conflicts) === JSON.stringify(['2026-08-10']), JSON.stringify(t3.conflicts));

    // Test 4 — overlap middle day
    const t4 = await bookHearse(2, ['2026-08-11', '2026-08-13']);
    check('Test 4 — overlap middle day 409', t4.statusCode === 409, `got ${t4.statusCode}`);
    check('Test 4 — conflict date is 2026-08-11', JSON.stringify(t4.conflicts) === JSON.stringify(['2026-08-11']), JSON.stringify(t4.conflicts));

    // Test 5 — overlap last day
    const t5 = await bookHearse(2, ['2026-08-13', '2026-08-12']);
    check('Test 5 — overlap last day 409', t5.statusCode === 409, `got ${t5.statusCode}`);
    check('Test 5 — conflict date is 2026-08-12', JSON.stringify(t5.conflicts) === JSON.stringify(['2026-08-12']), JSON.stringify(t5.conflicts));

    // Test 6 — completely different dates
    const t6 = await bookHearse(2, ['2026-08-13', '2026-08-14', '2026-08-15']);
    check('Test 6 — completely different dates AVAILABLE', t6.statusCode === 201, `got ${t6.statusCode}`);

    // Test 7 — multiple overlaps
    await bookHearse(1, ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-15']);
    const t7 = await bookHearse(1, ['2026-08-09', '2026-08-10', '2026-08-12', '2026-08-15', '2026-08-16']);
    check('Test 7 — multiple overlaps 409', t7.statusCode === 409, `got ${t7.statusCode}`);
    check('Test 7 — conflicts are 10,12,15', JSON.stringify(t7.conflicts) === JSON.stringify(['2026-08-10', '2026-08-12', '2026-08-15']), JSON.stringify(t7.conflicts));

    // Test 8 — different hearse
    const t8 = await bookHearse(3, ['2026-08-10', '2026-08-11', '2026-08-12']);
    check('Test 8 — different hearse AVAILABLE', t8.statusCode === 201, `got ${t8.statusCode}`);

    // Test 9 — concurrent multi-day booking (atomic row-lock serialization)
    const concurrentDates = ['2026-09-01', '2026-09-02', '2026-09-03'];
    const [a, b] = await Promise.all([
        bookHearse(2, concurrentDates),
        bookHearse(2, concurrentDates)
    ]);
    const successes = [a, b].filter((x) => x.statusCode === 201).length;
    const conflicts = [a, b].filter((x) => x.statusCode === 409).length;
    check('Test 9 — exactly ONE concurrent booking succeeded', successes === 1, `successes=${successes}, conflicts=${conflicts}`);
    check('Test 9 — the other concurrent request got 409', conflicts === 1, `successes=${successes}, conflicts=${conflicts}`);
}

(async () => {
    console.log('=== HEARSE MULTI-DAY BOOKING TEST SUITE ===');
    console.log('Test DB:', TEST_DB);
    try {
        await ensureTestDb();
        runUnitTests();
        await runIntegrationTests();
    } catch (error) {
        failed++;
        failures.push({ name: 'suite error', details: error.message });
        console.error('Suite failed:', error);
    } finally {
        if (pool) await pool.end();
        try {
            const root = await mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD });
            await root.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
            await root.end();
        } catch { /* noop */ }
    }

    console.log('\n=== RESULTS ===');
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    if (failures.length) {
        console.log('\nFailures:');
        for (const f of failures) console.log(`  - ${f.name}: ${f.details || ''}`);
    }
    process.exit(failed > 0 ? 1 : 0);
})();