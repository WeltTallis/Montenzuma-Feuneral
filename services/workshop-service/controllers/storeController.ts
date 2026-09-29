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
        const typeKey = (t: string) => `cft:${String(t).trim().toLowerCase().replace(/\s+/g, '-')}`;
        const byType = new Map<string, { type: string; count: number; colors: Set<string>; sizes: Set<string> }>();
        (coffins || []).forEach((c: any) => {
            const type = String(c.coffin_type ?? '').trim() || 'Uncategorised';
            const key = typeKey(type);
            if (!byType.has(key)) byType.set(key, { type, count: 0, colors: new Set(), sizes: new Set() });
            const bucket = byType.get(key)!;
            bucket.count += 1;
            if (c.color) bucket.colors.add(String(c.color));
            if (c.size) bucket.sizes.add(String(c.size));
        });

        const coffinTypes = [...byType.entries()].map(([key, b]) => ({
            key, type: b.type, count: b.count, colors: [...b.colors], sizes: [...b.sizes],
        })).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

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

        // Coffin quantities are DERIVED (produced − dispatched), so an order
        // reaching the Store raises its type's count and every dispatch lowers
        // it — no manual reconciling, and the ledger stays the source of truth
        // for what has actually gone out.
        const dispatchRows: any = await safeTenantQuery(tenantDb,
            `SELECT item_key, SUM(qty) AS qty FROM store_transactions
             WHERE action = 'DISPATCH' AND item_key LIKE 'cft:%' GROUP BY item_key`);
        const dispatchedByKey = new Map<string, number>(
            (dispatchRows || []).map((r: any) => [String(r.item_key), Number(r.qty) || 0])
        );
        for (const { key, count } of coffinTypes) {
            const target = Math.max(0, count - (dispatchedByKey.get(key) || 0));
            await safeTenantExecute(tenantDb, 'UPDATE store_items SET quantity = ? WHERE item_key = ?', [target, key]);
        }

        // Retire the old per-order `cf:<id>` rows: zero them so they stop
        // inflating totals, then drop the empty ones entirely.
        await safeTenantExecute(tenantDb, `UPDATE store_items SET quantity = 0 WHERE item_key LIKE 'cf:%'`);
        await safeTenantExecute(tenantDb, `DELETE FROM store_items WHERE item_key LIKE 'cf:%' AND quantity = 0`);

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
    getHistory
};
