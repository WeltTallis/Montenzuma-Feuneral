#!/usr/bin/env node
/**
 * Widen `users.tenant_id` from INT to VARCHAR(64).
 *
 * WHY
 * ---
 * The platform provisions tenant keys as UUID STRINGS, but
 * `scripts/auto-init-system-admin.ts` used to create `users.tenant_id` as
 * `INT NOT NULL`. Whichever script created the table first won permanently
 * (`CREATE TABLE IF NOT EXISTS` never alters an existing column), so an
 * install can end up with a numeric column that cannot hold the UUID the rest
 * of the system reads and writes — the system admin then fails to initialise
 * with "id required as string but initiated as number".
 *
 * `auto-init-system-admin.ts` has been corrected to declare VARCHAR. This
 * script repairs databases that were already created with the INT column.
 *
 * SAFE / IDEMPOTENT
 *   - Reports what it will do and changes nothing unless --apply is passed.
 *   - Skips any column that is already a character type.
 *   - Widening INT -> VARCHAR is lossless: every existing integer is preserved
 *     as its decimal text. The NOT NULL constraint is deliberately dropped
 *     because UUID columns are nullable (matches ensure-tenant-admin.js).
 *
 * Run:  node scripts/fix-tenant-id-column.js           (dry run, prints a plan)
 *       node scripts/fix-tenant-id-column.js --apply   (performs the change)
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const APPLY = process.argv.includes('--apply');

async function connect() {
    const base = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306', 10),
    };
    const attempts = [
        { ...base, user: process.env.DB_USER, password: process.env.DB_PASSWORD },
        { ...base, user: process.env.DB_ADMIN_USER || 'root', password: process.env.DB_ADMIN_PASSWORD || 'root' },
    ];
    let lastErr;
    for (const cfg of attempts) {
        if (!cfg.user) continue;
        try {
            return await mysql.createConnection({ ...cfg, multipleStatements: false });
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr || new Error('No usable DB credentials found (DB_USER / DB_ADMIN_USER).');
}

/** Every schema that holds a `users` table with a tenant link. */
async function findTargets(connection) {
    const [rows] = await connection.query(
        `SELECT TABLE_SCHEMA, COLUMN_TYPE, IS_NULLABLE
           FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'tenant_id'
            AND TABLE_SCHEMA NOT IN ('information_schema','mysql','performance_schema','sys')`
    );
    return rows;
}

const isCharType = (t) => /^(char|varchar|text|enum|set)/i.test(String(t || ''));

async function main() {
    const connection = await connect();
    try {
        const targets = await findTargets(connection);

        if (!targets.length) {
            console.log('No users.tenant_id columns found — nothing to do.');
            return;
        }

        const needsFix = targets.filter((t) => !isCharType(t.COLUMN_TYPE));
        const alreadyOk = targets.filter((t) => isCharType(t.COLUMN_TYPE));

        for (const t of alreadyOk) {
            console.log(`  skip   ${t.TABLE_SCHEMA}.users.tenant_id  (${t.COLUMN_TYPE} — already correct)`);
        }

        if (!needsFix.length) {
            console.log('\nAll users.tenant_id columns are already character types. Nothing to do.');
            return;
        }

        console.log('\nPlan:');
        for (const t of needsFix) {
            console.log(`  ALTER ${t.TABLE_SCHEMA}.users  MODIFY tenant_id VARCHAR(64) NULL   (currently ${t.COLUMN_TYPE})`);
        }

        if (!APPLY) {
            console.log('\nDry run. Re-run with --apply to perform these changes.');
            console.log('Tip: take a backup first —  mysqldump --single-transaction <db> > backup.sql');
            return;
        }

        console.log('\nApplying...');
        for (const t of needsFix) {
            const db = `\`${String(t.TABLE_SCHEMA).replace(/`/g, '``')}\``;
            await connection.query(`ALTER TABLE ${db}.users MODIFY tenant_id VARCHAR(64) NULL`);
            console.log(`  ok     ${t.TABLE_SCHEMA}.users.tenant_id widened to VARCHAR(64)`);
        }
        console.log('\nDone. Restart auth-service so the system admin is re-initialised.');
    } finally {
        await connection.end();
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Failed:', err.message);
        process.exit(1);
    });