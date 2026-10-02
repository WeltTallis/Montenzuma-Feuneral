import { Request, Response } from "express"
import axios from 'axios';
import { safeTenantQuery, safeTenantExecute } from '../database/db'
// @ts-ignore - socket module types not fully declared
import { getIO } from '../socket'

const SOCKETIO_SERVICE_URL = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';

const emitNotification = async (event: string, data: any, tenantSlug: string) => {
    try {

        await axios.post(`${SOCKETIO_SERVICE_URL}/emit/${event}`, {

            tenantSlug,
            data

        }, { timeout: 3000 });

    } catch (error) {
        console.warn(`[WORKSHOP] Failed to emit ${event}: ${(error as any).message}`);
    }
};

/**
 * Store Management — inventory ledger + dispatch/restock history for the
 * Workshop "Store" tab. Multi-tenant: each tenant has its own database, so
 * no tenant_slug column is needed here.
 */

const ensureStoreTables = async (tenantDb: string) => {
    await safeTenantExecute(tenantDb, `
        CREATE TABLE IF NOT EXISTS store_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_key VARCHAR(255) NOT NULL,
            item_type VARCHAR(50) NOT NULL DEFAULT 'Item',
            item_name VARCHAR(255) NOT NULL,
            item_sub VARCHAR(255) DEFAULT '',
            unit VARCHAR(50) DEFAULT 'pcs',
            quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255),
            UNIQUE KEY uniq_item_key (item_key),
            INDEX idx_item_type (item_type)
        ) ENGINE=InnoDB`);
    await safeTenantExecute(tenantDb, `
        CREATE TABLE IF NOT EXISTS store_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_key VARCHAR(255) NOT NULL,
            item_type VARCHAR(50) NOT NULL DEFAULT 'Item',
            item_name VARCHAR(255) NOT NULL,
            item_sub VARCHAR(255) DEFAULT '',
            unit VARCHAR(50) DEFAULT 'pcs',
            action ENUM('DISPATCH','RESTOCK') NOT NULL,
            qty DECIMAL(12,2) NOT NULL DEFAULT 0,
            txn_date DATE NOT NULL,
            txn_by VARCHAR(255) NOT NULL DEFAULT '',
            notes TEXT,
            created_at VARCHAR(255) NOT NULL,
            INDEX idx_txn_date (txn_date),
            INDEX idx_item_key (item_key)
        ) ENGINE=InnoDB`);
    /* Monthly workshop output target, per calendar month.

       Keyed by year-month ("2026-10") rather than one global number, because the
       target is genuinely per month and a flat figure would misreport attainment
       for every month it was not written for. Row-per-month also keeps history:
       the target that applied at the time survives, so attainment is measured
       against what was actually aimed for. */
    await safeTenantExecute(tenantDb, `
        CREATE TABLE IF NOT EXISTS workshop_monthly_targets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            target_month VARCHAR(7) NOT NULL,
            target_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
            created_by VARCHAR(255) DEFAULT '',
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255),
            UNIQUE KEY uniq_target_month (target_month)
        ) ENGINE=InnoDB`);
    /* Per-WORKER monthly target: how many coffins one worker is expected to
       finish in a month.

       Its own table rather than a worker_id column on workshop_monthly_targets,
       because that table's UNIQUE key is (target_month) alone — a workshop-wide
       row and a per-worker row for the same month could not coexist under it.

       (worker_id, target_month) is unique so setting the same worker's month
       twice overwrites instead of stacking duplicate rows. */
    await safeTenantExecute(tenantDb, `
        CREATE TABLE IF NOT EXISTS workshop_worker_targets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            worker_id INT NOT NULL,
            target_month VARCHAR(7) NOT NULL,
            target_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
            created_by VARCHAR(255) DEFAULT '',
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255),
            UNIQUE KEY uniq_worker_target (worker_id, target_month),
            INDEX idx_worker_target_month (target_month)
        ) ENGINE=InnoDB`);
};

/* Accepted month format. A malformed "2026-13" is rejected rather than stored,
   because it would silently never match a real month and the target would look
   set while doing nothing. */
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/* GET /store/targets?year=2026 — every month of the year, target plus actual.

   The actual figure is counted from finished coffin orders using exactly the
   same rules as the worker report (same finished statuses, same credit-date
   fallback), so the progress bar can never disagree with the per-worker numbers
   shown beside it. Two different definitions of "finished" on one dashboard is
   how a payroll dispute starts. */
const getTargets = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });
        await ensureStoreTables(tenantDb);

        const year = parseInt(String(req.query.year || new Date().getFullYear()), 10) || new Date().getFullYear();

        const rows: any = await safeTenantQuery(tenantDb,
            `SELECT target_month, target_qty, created_by, updated_at
             FROM workshop_monthly_targets
             WHERE target_month LIKE ?
             ORDER BY target_month ASC`,
            [`${year}-%`]
        );

        const actual: any = await safeTenantQuery(tenantDb,
            `SELECT
                 DATE_FORMAT(COALESCE(NULLIF(completed_at,''), NULLIF(order_date,''), NULLIF(created_at,''), NOW()), '%Y-%m') AS ym,
                 COUNT(*) AS produced
             FROM coffin_orders
             WHERE status IN ('completed','delivered','store','dispatched','collected')
               AND COALESCE(NULLIF(completed_at,''), NULLIF(order_date,''), NULLIF(created_at,''), NOW()) >= ?
             GROUP BY ym`,
            [`${year}-01-01`]
        );

        const actualByMonth = new Map<string, number>(
            actual.map((a: any) => [String(a.ym), Number(a.produced) || 0])
        );
        const targetByMonth = new Map<string, any>(
            rows.map((r: any) => [String(r.target_month), r])
        );

        /* All twelve months are always returned so the client renders a complete
           year without filling gaps itself and getting it subtly wrong. */
        const months = [];
        for (let m = 1; m <= 12; m += 1) {
            const key = `${year}-${String(m).padStart(2, '0')}`;
            const t = targetByMonth.get(key);
            const targetQty = t ? Number(t.target_qty) || 0 : 0;
            const produced = actualByMonth.get(key) || 0;
            months.push({
                month: key,
                target: targetQty,
                produced,
                /* A month with no target is null, NOT "missed" — there was
                   nothing to hit, so the UI says "not set" instead of showing a
                   red shortfall for a month nobody aimed at. */
                met: targetQty > 0 ? produced >= targetQty : null,
                pct: targetQty > 0 ? Math.min(999, Math.round((produced / targetQty) * 100)) : null,
                setBy: t?.created_by || '',
                updatedAt: t?.updated_at || '',
            });
        }

        /* Per-worker targets for the same year, so the dashboard can colour a
           worker card the moment they cross their own number. Returned flat —
           the client indexes it by worker id + month — because the roster is
           small and a nested shape would only have to be walked twice. */
        const workerRows: any = await safeTenantQuery(tenantDb,
            `SELECT worker_id, target_month, target_qty
             FROM workshop_worker_targets
             WHERE target_month LIKE ?
             ORDER BY worker_id ASC, target_month ASC`,
            [`${year}-%`]
        );

        res.json({
            year,
            months,
            workerTargets: (workerRows || []).map((r: any) => ({
                worker_id: r.worker_id,
                month: String(r.target_month),
                target: Number(r.target_qty) || 0,
            })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to load monthly targets' });
    }
};

/* PUT /store/targets — set one month's target (upsert).

   Editing a month that already has a target overwrites it rather than failing
   on the unique key, which is what an admin correcting a typo expects. */
const setTarget = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });
        await ensureStoreTables(tenantDb);

        const month = String(req.body?.month || '').trim();
        const qty = Number(req.body?.target);
        /* Optional. Absent/null/'' means the workshop-wide target (the original
           behaviour); a number means that one worker's own target. */
        const rawWorker = req.body?.worker_id;
        const workerId = (rawWorker === null || rawWorker === undefined || rawWorker === '')
            ? null
            : Number(rawWorker);

        if (!MONTH_RE.test(month)) {
            return res.status(400).json({ error: 'Month must be in YYYY-MM format' });
        }
        if (workerId !== null && (!Number.isInteger(workerId) || workerId <= 0)) {
            return res.status(400).json({ error: 'worker_id must be a positive whole number' });
        }
        if (!Number.isFinite(qty) || qty < 0) {
            return res.status(400).json({ error: 'Target must be zero or greater' });
        }
        /* A fractional coffin is not a real target, and rounding silently would
           mean the stored number is not the number the admin typed. */
        if (Math.floor(qty) !== qty) {
            return res.status(400).json({ error: 'Target must be a whole number of coffins' });
        }

        const setBy = (req as any).user?.full_name
            || (req as any).user?.name
            || (req as any).user?.email
            || '';

        if (workerId !== null) {
            await safeTenantExecute(tenantDb,
                `INSERT INTO workshop_worker_targets
                    (worker_id, target_month, target_qty, created_by, created_at, updated_at)
                 VALUES (?, ?, ?, ?, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE
                    target_qty = VALUES(target_qty),
                    created_by = VALUES(created_by),
                    updated_at = NOW()`,
                [workerId, month, qty, setBy]
            );
            return res.json({ ok: true, worker_id: workerId, month, target: qty, setBy });
        }

        await safeTenantExecute(tenantDb,
            `INSERT INTO workshop_monthly_targets
                (target_month, target_qty, created_by, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                target_qty = VALUES(target_qty),
                created_by = VALUES(created_by),
                updated_at = NOW()`,
            [month, qty, setBy]
        );

        res.json({ ok: true, month, target: qty, setBy });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to save target' });
    }
};

const getInventory = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });
        await ensureStoreTables(tenantDb);

        // Base items: coffins sitting in the Store stage + workshop materials
        const coffins: any = await safeTenantQuery(tenantDb,
            `SELECT id, order_number, coffin_name, coffin_type, color, size
             FROM coffin_orders
             WHERE status IN ('completed','delivered','store')
             ORDER BY order_number`);
        const materials: any = await safeTenantQuery(tenantDb,
            `SELECT id, name, category, unit, quantity FROM materials ORDER BY name`);

        // ── Coffins are tracked BY TYPE, not one row per order ──────────────
        // Every finished order used to add its own `cf:<id>` store row, so the
        // store grew a long, meaningless list of individual coffins. The store
        // only ever needs to know "how many of each TYPE do we hold", so all
        // orders of the same type collapse into a single row keyed by the type.
        /* The search key is the normalised type, so "Executive", "executive "
           and "EXECUTIVE" are one store line rather than three. Everything that
           is not a letter or a digit folds into a hyphen first, which also makes
           "Standard 6ft" and "Standard-6ft" the same row. */
        const typeKey = (t: string) => {
            const slug = String(t).trim().toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            return `cft:${slug || 'uncategorised'}`;
        };

        /* A row is given ONE label. Previously it was whichever order happened to
           sort first, so the Store could show "standard" beside the "Standard"
           the operator had just picked from the order form. The most-used spelling
           now wins, and a label typed entirely in lower case is title-cased so
           legacy rows read like the types on the order form, while a spelling that
           already carries capitals ("XL", "6ft Casket") is left untouched. */
        const prettify = (s: string) =>
            s === s.toLowerCase() ? s.replace(/\b[a-z]/g, (ch) => ch.toUpperCase()) : s;

        const byType = new Map<string, { spellings: Map<string, number>; count: number; colors: Set<string>; sizes: Set<string> }>();
        (coffins || []).forEach((c: any) => {
            const type = String(c.coffin_type ?? '').trim() || 'Uncategorised';
            const key = typeKey(type);
            if (!byType.has(key)) byType.set(key, { spellings: new Map(), count: 0, colors: new Set(), sizes: new Set() });
            const bucket = byType.get(key)!;
            bucket.count += 1;
            bucket.spellings.set(type, (bucket.spellings.get(type) || 0) + 1);
            if (c.color) bucket.colors.add(String(c.color));
            if (c.size) bucket.sizes.add(String(c.size));
        });

        const coffinTypes = [...byType.entries()].map(([key, b]) => {
            const spelling = [...b.spellings.entries()].sort((x, y) => {
                if (y[1] !== x[1]) return y[1] - x[1];                        // most used
                const capX = Number(x[0][0] === x[0][0].toUpperCase());
                const capY = Number(y[0][0] === y[0][0].toUpperCase());
                if (capX !== capY) return capY - capX;                        // capitalised first
                if (x[0].length !== y[0].length) return x[0].length - y[0].length;
                return x[0].localeCompare(y[0]);
            })[0][0];
            return { key, type: prettify(spelling), count: b.count, colors: [...b.colors], sizes: [...b.sizes] };
        }).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

        const syncItems: any[] = [];
        coffinTypes.forEach(({ key, type, count, colors, sizes }) => {
            syncItems.push({
                key, type: 'Coffin', name: type, unit: 'pcs', qty: count,
                sub: [sizes[0], colors[0]].filter(Boolean).join(' · ') || 'Coffin',
            });
        });
        (materials || []).forEach((m: any) => syncItems.push({
            key: 'mat:' + m.id, type: 'Material', name: m.name, sub: m.category || 'General',
            unit: m.unit || 'pcs', qty: Number(m.quantity) || 0
        }));

        // Upsert base rows (create when first seen, refresh metadata otherwise)
        for (const it of syncItems) {
            const existing: any = await safeTenantQuery(tenantDb, 'SELECT id FROM store_items WHERE item_key = ?', [it.key]);
            if (!existing.length) {
                await safeTenantExecute(tenantDb,
                    `INSERT INTO store_items (item_key, item_type, item_name, item_sub, unit, quantity, created_at) VALUES (?,?,?,?,?,?,?)`,
                    [it.key, it.type, it.name, it.sub, it.unit, it.qty, new Date().toISOString()]);
            } else {
                await safeTenantExecute(tenantDb,
                    `UPDATE store_items SET item_type=?, item_name=?, item_sub=?, unit=? WHERE item_key=?`,
                    [it.type, it.name, it.sub, it.unit, it.key]);
            }
        }

        /* quantity = produced + manually added - dispatched.

           "Produced" is how many finished orders of that type exist; the ledger
           supplies the other two legs. The RESTOCK leg matters: the quantity used
           to be recomputed from production alone, so an operator's "Add" on a
           coffin type was silently wiped the next time the Store was opened. */
        const ledgerRows: any = await safeTenantQuery(tenantDb,
            `SELECT item_key, action, SUM(qty) AS qty FROM store_transactions
             WHERE item_key LIKE 'cft:%' AND action IN ('DISPATCH','RESTOCK')
             GROUP BY item_key, action`);
        const ledgerByKey = (action: string) => new Map<string, number>(
            (ledgerRows || [])
                .filter((r: any) => r.action === action)
                .map((r: any) => [String(r.item_key), Number(r.qty) || 0])
        );
        const dispatchedByKey = ledgerByKey('DISPATCH');
        const restockedByKey = ledgerByKey('RESTOCK');

        for (const { key, count } of coffinTypes) {
            const target = Math.max(0, count + (restockedByKey.get(key) || 0) - (dispatchedByKey.get(key) || 0));
            await safeTenantExecute(tenantDb, 'UPDATE store_items SET quantity = ? WHERE item_key = ?', [target, key]);
        }

        // Retire the old per-order `cf:<id>` rows: zero them so they stop
        // inflating totals, then drop the empty ones entirely.
        await safeTenantExecute(tenantDb, `UPDATE store_items SET quantity = 0 WHERE item_key LIKE 'cf:%'`);
        await safeTenantExecute(tenantDb, `DELETE FROM store_items WHERE item_key LIKE 'cf:%' AND quantity = 0`);

        /* Coffin rows that correspond to nothing: no finished order behind them
           and no ledger entry either. These are leftovers from the old per-order
           `cf:<id>` scheme, or a type whose orders were all deleted, and leaving
           them at a stale quantity is what made the Store disagree with the
           floor. A row WITH history is kept even at zero — that is a real type
           the Store tracks and has simply run out of. */
        const derivedKeys = coffinTypes.map((c) => c.key);
        const orphanFilter = derivedKeys.length
            ? ` AND item_key NOT IN (${derivedKeys.map(() => '?').join(',')})`
            : '';
        await safeTenantExecute(tenantDb,
            `DELETE FROM store_items
              WHERE item_key LIKE 'cft:%'${orphanFilter}
                AND item_key NOT IN (SELECT DISTINCT item_key FROM store_transactions WHERE item_key LIKE 'cft:%')`,
            derivedKeys);

        const items: any = await safeTenantQuery(tenantDb, 'SELECT * FROM store_items ORDER BY item_type, item_name');
        const history: any = await safeTenantQuery(tenantDb, 'SELECT * FROM store_transactions ORDER BY txn_date DESC, id DESC');

        let totalUnits = 0, coffinsCount = 0, materialsUnits = 0;
        (items || []).forEach((it: any) => {
            const q = Number(it.quantity) || 0;
            totalUnits += q;
            if (it.item_type === 'Coffin') coffinsCount += q;
            else materialsUnits += q;
        });
        const todayKey = new Date().toISOString().slice(0, 10);
        const dispatchedToday = (history || []).filter(h => h.action === 'DISPATCH' && String(h.txn_date).slice(0, 10) === todayKey).reduce((s: number, h: any) => s + Number(h.qty || 0), 0);
        const totalDispatched = (history || []).filter(h => h.action === 'DISPATCH').reduce((s: number, h: any) => s + Number(h.qty || 0), 0);

        res.json({
            coffins, materials, items, history, coffinTypes,
            stats: {
                totalUnits, coffinsCount, materialsUnits, dispatchedToday, totalDispatched,
                coffinTypeCount: coffinTypes.length,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const dispatchItem = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });
        await ensureStoreTables(tenantDb);

        const { item_key, item_type, item_name, item_sub, unit, qty, date, picked_by, notes } = req.body;
        if (!item_key) return res.status(400).json({ error: 'item_key is required' });
        const q = Number(qty) || 0;
        if (q <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });
        const txnDate = date || new Date().toISOString().slice(0, 10);

        let row: any = null;
        const existing: any = await safeTenantQuery(tenantDb, 'SELECT id, quantity FROM store_items WHERE item_key = ?', [item_key]);
        if (!existing.length) {
            await safeTenantExecute(tenantDb,
                `INSERT INTO store_items (item_key, item_type, item_name, item_sub, unit, quantity, created_at) VALUES (?,?,?,?,?,?,?)`,
                [item_key, item_type || 'Item', item_name || item_key, item_sub || '', unit || 'pcs', 0, new Date().toISOString()]);
        } else {
            row = existing[0];
        }
        const available = row ? (Number(row.quantity) || 0) : 0;
        if (available < q) {
            return res.status(400).json({ error: `Insufficient stock. Available: ${available}, Requested: ${q}` });
        }

        await safeTenantExecute(tenantDb, 'UPDATE store_items SET quantity = quantity - ? WHERE item_key = ?', [q, item_key]);
        const insertResult: any = await safeTenantExecute(tenantDb,
            `INSERT INTO store_transactions (item_key, item_type, item_name, item_sub, unit, action, qty, txn_date, txn_by, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [item_key, item_type || 'Item', item_name || item_key, item_sub || '', unit || 'pcs', 'DISPATCH', q, txnDate, picked_by || '', notes || '', new Date().toISOString()]);

        const updated: any = await safeTenantQuery(tenantDb, 'SELECT * FROM store_items WHERE item_key = ?', [item_key]);
        const txn: any = await safeTenantQuery(tenantDb, 'SELECT * FROM store_transactions WHERE id = ?', [insertResult.insertId]);
        try { const io = getIO(); if (io) io.emit('store:dispatch', txn[0]); } catch { /* socket optional */ }

        // Emit a notification through the Socket.IO service so the Store dispatch
        // surfaces in the Notification Bell (same pattern used by deceased/hearse services)
        await emitNotification('store-dispatch', {
            id: `store-dispatch-${insertResult.insertId}-${Date.now()}`,
            transactionId: insertResult.insertId,
            itemKey: item_key,
            itemType: item_type || 'Item',
            itemName: item_name || item_key,
            unit: unit || 'pcs',
            qty: q,
            dispatchedBy: picked_by || '',
            date: txnDate,
            title: 'Store Item Dispatched',
            message: `${item_name || item_key} (${q} ${unit || 'pcs'}) dispatched from store${picked_by ? ` by ${picked_by}` : ''}`,
            type: 'store-dispatch',
            priority: 'medium',
            fullContent: `Item: ${item_name || item_key}\nType: ${item_type || 'Item'}\nQuantity: ${q} ${unit || 'pcs'}\nDate: ${txnDate}\nDispatched By: ${picked_by || 'N/A'}\nNotes: ${notes || 'None'}`
        }, (req as any).tenantSlug || 'system');

        res.status(201).json({ success: true, item: updated[0], transaction: txn[0] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const restockItem = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });
        await ensureStoreTables(tenantDb);

        const { item_key, item_type, item_name, item_sub, unit, qty, date, received_by, notes } = req.body;
        if (!item_key) return res.status(400).json({ error: 'item_key is required' });
        const q = Number(qty) || 0;
        if (q <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });
        const txnDate = date || new Date().toISOString().slice(0, 10);
        const by = received_by || req.body.picked_by || '';

        const existing: any = await safeTenantQuery(tenantDb, 'SELECT id FROM store_items WHERE item_key = ?', [item_key]);
        if (!existing.length) {
            await safeTenantExecute(tenantDb,
                `INSERT INTO store_items (item_key, item_type, item_name, item_sub, unit, quantity, created_at) VALUES (?,?,?,?,?,?,?)`,
                [item_key, item_type || 'Item', item_name || item_key, item_sub || '', unit || 'pcs', 0, new Date().toISOString()]);
        }
        await safeTenantExecute(tenantDb, 'UPDATE store_items SET quantity = quantity + ? WHERE item_key = ?', [q, item_key]);
        const insertResult: any = await safeTenantExecute(tenantDb,
            `INSERT INTO store_transactions (item_key, item_type, item_name, item_sub, unit, action, qty, txn_date, txn_by, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [item_key, item_type || 'Item', item_name || item_key, item_sub || '', unit || 'pcs', 'RESTOCK', q, txnDate, by, notes || '', new Date().toISOString()]);

        const updated: any = await safeTenantQuery(tenantDb, 'SELECT * FROM store_items WHERE item_key = ?', [item_key]);
        const txn: any = await safeTenantQuery(tenantDb, 'SELECT * FROM store_transactions WHERE id = ?', [insertResult.insertId]);
        try { const io = getIO(); if (io) io.emit('store:restock', txn[0]); } catch { /* socket optional */ }

        res.status(201).json({ success: true, item: updated[0], transaction: txn[0] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const getHistory = async (req: Request, res: Response) => {
    try {
        const tenantDb = (req as any).tenant?.db_name;
        if (!tenantDb) return res.status(400).json({ error: 'Tenant database not resolved' });
        await ensureStoreTables(tenantDb);

        let sql = 'SELECT * FROM store_transactions';
        const params: any[] = [];
        const conditions: string[] = [];
        if (req.query.date) { conditions.push('txn_date = ?'); params.push(req.query.date); }
        if (req.query.item_key) { conditions.push('item_key = ?'); params.push(req.query.item_key); }
        if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
        sql += ' ORDER BY txn_date DESC, id DESC';

        const history: any = await safeTenantQuery(tenantDb, sql, params);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export {
    getInventory,
    dispatchItem,
    restockItem,
    getHistory,
    getTargets,
    setTarget
};
