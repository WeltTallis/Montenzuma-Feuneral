import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Pool, PoolConnection } from 'mysql2/promise';
import { getHearsePool } from '../database';
import { extractRowDates } from '../utilities/hearseAvailability';
import { emitHearseDataChanged } from '../utilities/hearseRealtime';

const DEFAULT_LOW_BALANCE_THRESHOLD = '5000.00';

class WalletError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

function getTenantKey(req: Request): string | null {
    const headerOf = (name: string): string | null => {
        const value = req.headers[name];
        return Array.isArray(value) ? value[0] : value ? String(value) : null;
    };
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || (req as any).user?.tenant_id
        || headerOf('x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id;
    const tenantSlug = (req as any).tenantSlug || (req as any).user?.tenantSlug || (req as any).user?.tenant_slug
        || headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug;
    const key = tenantId ? `id:${String(tenantId).trim()}` : tenantSlug ? `slug:${String(tenantSlug).trim()}` : null;
    return key && !key.endsWith(':') && key.length <= 191 ? key : null;
}

function getDriverContext(req: Request, res: Response): { ids: number[]; primaryId: number } | null {
    const user = (req as any).user || {};
    if (String(user.role || '').toLowerCase() !== 'driver') {
        res.status(403).json({ success: false, message: 'Only authenticated driver accounts can use driver fuelling.' });
        return null;
    }
    const ids = [user.driver_id, user.driverId, user.id, user.user_id, user.userId, user.sub]
        .map(Number)
        .filter((id, index, all) => Number.isInteger(id) && id > 0 && all.indexOf(id) === index);
    if (!ids.length) {
        res.status(403).json({ success: false, message: 'Driver identity is not available in the authenticated account.' });
        return null;
    }
    return { ids, primaryId: ids[0] };
}

function hearseTenantScope(tenantKey: string, alias = '', tenantSlugOverride: string | null = null): { clause: string; params: any[] } {
    const tenantId = tenantKey.startsWith('id:') ? tenantKey.slice(3).trim() : null;
    const slug = tenantKey.startsWith('slug:')
        ? tenantKey.slice(5).trim()
        : (tenantSlugOverride ? String(tenantSlugOverride).trim() : null);
    const prefix = alias ? `${alias}.` : '';
    const clauses: string[] = [];
    const params: any[] = [];
    if (tenantId) {
        clauses.push(`${prefix}\`tenant_id\` = ?`);
        params.push(tenantId);
    }
    if (slug) {
        clauses.push(`${prefix}\`tenant_slug\` = ?`);
        params.push(slug);
    }
    if (tenantId && slug) {
        clauses.push(`(${prefix}\`tenant_id\` IS NULL AND ${prefix}\`tenant_slug\` = ?)`);
        params.push(slug);
    }
    if (!clauses.length) {
        clauses.push(`${prefix}\`tenant_slug\` = ?`);
        params.push(tenantKey);
    }
    return { clause: `(${clauses.join(' OR ')})`, params };
}

function getTenantSlug(req: Request): string | null {
    const headerOf = (name: string): string | null => {
        const value = req.headers[name];
        return Array.isArray(value) ? value[0] : value ? String(value) : null;
    };
    return (req as any).tenantSlug || (req as any).user?.tenantSlug || (req as any).user?.tenant_slug
        || headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug || null;
}

function requireTenant(req: Request, res: Response): string | null {
    const tenantKey = getTenantKey(req);
    if (!tenantKey) {
        res.status(400).json({ success: false, message: 'A valid tenant context is required for fuel-card accounting.' });
        return null;
    }
    return tenantKey;
}

function validAmount(value: unknown): string | null {
    const text = String(value ?? '').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const amount = Number(text);
    return Number.isFinite(amount) && amount > 0 && amount <= 100000000
        ? amount.toFixed(2)
        : null;
}

function validDate(value: unknown): string | null {
    const date = String(value ?? '');
    const parsed = new Date(`${date}T00:00:00.000Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(date)
        && !Number.isNaN(parsed.getTime())
        && parsed.toISOString().slice(0, 10) === date
        ? date
        : null;
}

async function ensureAccount(pool: Pool | PoolConnection, tenantKey: string): Promise<void> {
    await pool.query(
        `INSERT IGNORE INTO hearse_fuel_accounts (tenant_key, low_balance_threshold)
         VALUES (?, ?)`,
        [tenantKey, DEFAULT_LOW_BALANCE_THRESHOLD]
    );
}









async function getSummary(pool: Pool, tenantKey: string, tenantSlug: string | null = null) {
    await ensureAccount(pool, tenantKey);
    const tenantScope = hearseTenantScope(tenantKey, 'h', tenantSlug);
    const [[accountRows], [totalsRows], [cardRows], [historyRows], [activityRows], [latestActivityRows], [currentDateRows]]: any = await Promise.all([
        pool.query('SELECT low_balance_threshold FROM hearse_fuel_accounts WHERE tenant_key = ?', [tenantKey]),
        pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END), 0) AS deposited,
                COALESCE(SUM(CASE WHEN transaction_type = 'allocation' THEN amount ELSE 0 END), 0) AS allocated,
                COALESCE(SUM(CASE WHEN transaction_type = 'fuel_purchase' THEN amount ELSE 0 END), 0) AS spent
             FROM hearse_fuel_transactions WHERE tenant_key = ?`,
            [tenantKey]
        ),
        pool.query(
            `SELECT h.id AS hearse_id, h.plate_number, h.hearse_name, h.fuel_card_number,
                COALESCE(SUM(CASE
                    WHEN t.transaction_type = 'allocation' THEN t.amount
                    WHEN t.transaction_type = 'fuel_purchase' THEN -t.amount
                    ELSE 0
                END), 0) AS balance,
                COALESCE(SUM(CASE WHEN t.transaction_type = 'allocation' THEN t.amount ELSE 0 END), 0) AS total_allocated,
                COALESCE(SUM(CASE WHEN t.transaction_type = 'fuel_purchase' THEN t.amount ELSE 0 END), 0) AS total_spent,
                COALESCE(SUM(CASE
                    WHEN t.transaction_type = 'fuel_purchase'
                     AND t.transaction_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                     AND t.transaction_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                    THEN t.amount ELSE 0
                END), 0) AS spent_this_month
             FROM hearses h
             LEFT JOIN hearse_fuel_transactions t
                ON t.tenant_key = ? AND t.fuel_card_number = h.fuel_card_number
             WHERE ${tenantScope.clause} AND h.fuel_card_number IS NOT NULL AND TRIM(h.fuel_card_number) <> ''
             GROUP BY h.id, h.plate_number, h.hearse_name, h.fuel_card_number
             ORDER BY h.plate_number`,
            [tenantKey, ...tenantScope.params]
        ),
        pool.query(
            `SELECT id, transaction_type, amount, hearse_plate, fuel_card_number,
                reference, station, transaction_date, notes, created_at
             FROM hearse_fuel_transactions
             WHERE tenant_key = ?
             ORDER BY id DESC
             LIMIT 20`,
            [tenantKey]
        ),
        pool.query(
             `SELECT fuel_card_number,
                 DATE_FORMAT(transaction_date, '%Y-%m-%d') AS activity_date,
                 COALESCE(SUM(CASE WHEN transaction_type = 'allocation' THEN amount ELSE 0 END), 0) AS allocations,
                 COALESCE(SUM(CASE WHEN transaction_type = 'fuel_purchase' THEN amount ELSE 0 END), 0) AS purchases
              FROM hearse_fuel_transactions
              WHERE tenant_key = ?
                AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                AND transaction_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              GROUP BY fuel_card_number, DATE(transaction_date)
              ORDER BY activity_date`,
             [tenantKey]
        ),
        pool.query(
             `SELECT t.fuel_card_number, t.transaction_type, t.amount, t.station,
                 t.reference, t.notes, t.driver_id, DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date, t.created_at
              FROM hearse_fuel_transactions t
              INNER JOIN (
                  SELECT fuel_card_number, MAX(id) AS id
                  FROM hearse_fuel_transactions
                  WHERE tenant_key = ? AND fuel_card_number IS NOT NULL
                  GROUP BY fuel_card_number
              ) latest ON latest.id = t.id`,
             [tenantKey]
        ),
        pool.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today_date"),
    ]);
    const totals = totalsRows[0];
    const deposited = Number(totals.deposited);
    const allocated = Number(totals.allocated);
    const spent = Number(totals.spent);
    const threshold = Number(accountRows[0]?.low_balance_threshold ?? DEFAULT_LOW_BALANCE_THRESHOLD);
    const cards = cardRows.map((card: any) => {
        const balance = Number(card.balance);
        const cardActivity = activityRows.filter((activity: any) =>
            String(activity.fuel_card_number) === String(card.fuel_card_number)
        );
        const activityByDate = new Map<string, { allocations: number; purchases: number }>(cardActivity.map((activity: any) => [
            String(activity.activity_date),
            {
                allocations: Number(activity.allocations),
                purchases: Number(activity.purchases),
            },
        ]));
        const todayUtc = new Date(`${currentDateRows[0].today_date}T00:00:00.000Z`);
        let closingBalance = balance;
        const balanceHistory = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date(todayUtc);
            date.setUTCDate(date.getUTCDate() - offset);
            const activityDate = date.toISOString().slice(0, 10);
            const dayActivity = activityByDate.get(activityDate) || { allocations: 0, purchases: 0 };
            balanceHistory.push({
                date: activityDate,
                balance: closingBalance,
                allocations: dayActivity.allocations,
                purchases: dayActivity.purchases,
            });
            closingBalance -= dayActivity.allocations - dayActivity.purchases;
        }
        const latestActivity = latestActivityRows.find((activity: any) =>
            String(activity.fuel_card_number) === String(card.fuel_card_number)
        ) || null;
        return {
            ...card,
            balance,
            total_allocated: Number(card.total_allocated),
            total_spent: Number(card.total_spent),
            spent_this_month: Number(card.spent_this_month),
            balance_history: balanceHistory,
            latest_activity: latestActivity,
            is_low: balance < threshold,
        };
    });

    return {
        account_balance: (deposited - allocated).toFixed(2),
        available_to_allocate: (deposited - allocated).toFixed(2),
        total_on_cards: (allocated - spent).toFixed(2),
        total_remaining: (deposited - spent).toFixed(2),
        total_deposited: deposited.toFixed(2),
        total_allocated: allocated.toFixed(2),
        total_spent: spent.toFixed(2),
        low_balance_threshold: threshold.toFixed(2),
        cards,
        transactions: historyRows,
    };
}









async function getDriverFuelSummary(pool: Pool, tenantKey: string, driverIds: number[], tenantSlug: string | null = null) {
    const summary = await getSummary(pool, tenantKey, tenantSlug);
    const tenantScope = hearseTenantScope(tenantKey, 'h', tenantSlug);
    const [hearseRows]: any = await pool.query(
        `SELECT h.id AS hearse_id, h.plate_number, h.hearse_name, h.fuel_card_number
         FROM hearses h
         WHERE ${tenantScope.clause}
           AND (
               h.driver_id IN (?)
               OR EXISTS (
                   SELECT 1 FROM hearse_bookings hb
                   WHERE hb.hearse_id = h.id
                     AND hb.driver_id IN (?)
                     AND hb.status IN ('pending', 'booked', 'confirmed', 'in_transit', 'transit', 'reserved', 'in_progress')
               )
           )
           AND h.fuel_card_number IS NOT NULL AND TRIM(h.fuel_card_number) <> ''
         ORDER BY h.plate_number`,
        [...tenantScope.params, driverIds, driverIds]
    );
    const cards = hearseRows.map((hearse: any) => {
        const card = summary.cards.find((item: any) => String(item.hearse_id) === String(hearse.hearse_id));
        return card ? {
            hearse_id: hearse.hearse_id,
            plate_number: hearse.plate_number,
            hearse_name: hearse.hearse_name,
            card_last_four: String(hearse.fuel_card_number).slice(-4),
            balance: card.balance,
            is_low: card.is_low,
        } : null;
    }).filter(Boolean);
    const [transactions]: any = await pool.query(
        `SELECT id, transaction_type, amount, hearse_plate, station, reference, transaction_date
         FROM hearse_fuel_transactions
         WHERE tenant_key = ? AND driver_id IN (?)
         ORDER BY id DESC LIMIT 10`,
        [tenantKey, driverIds]
    );
    return {
        low_balance_threshold: summary.low_balance_threshold,
        cards,
        transactions,
    };
}






async function withLockedWallet<T>(
    tenantKey: string,
    callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
    const pool = await getHearsePool();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await ensureAccount(connection, tenantKey);
        await connection.query(
            'SELECT tenant_key FROM hearse_fuel_accounts WHERE tenant_key = ? FOR UPDATE',
            [tenantKey]
        );
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}






async function getHearseCard(connection: PoolConnection, tenantKey: string, hearseId: unknown, tenantSlug: string | null = null) {
    const tenantScope = hearseTenantScope(tenantKey, '', tenantSlug);
    const [rows]: any = await connection.query(
        `SELECT id, plate_number, fuel_card_number
         FROM hearses WHERE id = ? AND ${tenantScope.clause} FOR UPDATE`,
        [hearseId, ...tenantScope.params]
    );
    const hearse = rows[0];
    if (!hearse) throw new WalletError(404, 'Hearse not found for this tenant.');
    const cardNumber = String(hearse.fuel_card_number || '').trim();
    if (!cardNumber) throw new WalletError(400, 'Assign a fuel card to this hearse before recording card activity.');
    return { ...hearse, fuel_card_number: cardNumber };
}










async function getCardBalance(connection: PoolConnection, tenantKey: string, cardNumber: string): Promise<number> {
    const [rows]: any = await connection.query(
        `SELECT COALESCE(SUM(CASE
            WHEN transaction_type = 'allocation' THEN amount
            WHEN transaction_type = 'fuel_purchase' THEN -amount
            ELSE 0
         END), 0) AS balance
         FROM hearse_fuel_transactions
         WHERE tenant_key = ? AND fuel_card_number = ?`,
        [tenantKey, cardNumber]
    );
    return Number(rows[0].balance);
}









async function getAvailableToAllocate(connection: PoolConnection, tenantKey: string): Promise<number> {
    const [rows]: any = await connection.query(
        `SELECT
            COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN transaction_type = 'allocation' THEN amount ELSE 0 END), 0)
            AS available
         FROM hearse_fuel_transactions WHERE tenant_key = ?`,
        [tenantKey]
    );
    return Number(rows[0].available);
}









async function recordTransaction(
    connection: PoolConnection,
    tenantKey: string,
    details: {
        type: 'deposit' | 'allocation' | 'fuel_purchase';
        amount: string;
        transactionDate: string;
        hearse?: any;
        reference?: string | null;
        station?: string | null;
        notes?: string | null;
        driverId?: number | null;
    }
): Promise<void> {
    await connection.query(
        `INSERT INTO hearse_fuel_transactions
            (tenant_key, transaction_type, amount, hearse_id, hearse_plate, fuel_card_number,
             reference, station, transaction_date, notes, driver_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tenantKey,
            details.type,
            details.amount,
            details.hearse?.id ?? null,
            details.hearse?.plate_number ?? null,
            details.hearse?.fuel_card_number ?? null,
            details.reference || null,
            details.station || null,
            details.transactionDate,
            details.notes || null,
            details.driverId ?? null,
        ]
    );
}

function sendError(res: Response, error: unknown, fallback: string): void {
    if (error instanceof WalletError) {
        res.status(error.status).json({ success: false, message: error.message });
        return;
    }
    console.error(`[hearse-fuel] ${fallback}`, error);
    res.status(500).json({ success: false, message: fallback });
}

export const getFuelWallet = asyncHandler(async (req: Request, res: Response) => {
    const tenantKey = requireTenant(req, res);
    if (!tenantKey) return;
    try {
        const pool = await getHearsePool();
        res.json({ success: true, ...await getSummary(pool, tenantKey, getTenantSlug(req)) });
    } catch (error) {
        sendError(res, error, 'Unable to load the fuel account.');
    }
});









export const addFuelDeposit = asyncHandler(async (req: Request, res: Response) => {
    const tenantKey = requireTenant(req, res);
    if (!tenantKey) return;
    const amount = validAmount(req.body.amount);
    const transactionDate = validDate(req.body.transaction_date);
    if (!amount || !transactionDate) {
        res.status(400).json({ success: false, message: 'Enter a valid deposit amount and date.' });
        return;
    }
    try {
        await withLockedWallet(tenantKey, (connection) => recordTransaction(connection, tenantKey, {
            type: 'deposit',
            amount,
            transactionDate,
            reference: String(req.body.reference || '').trim().slice(0, 120) || null,
            notes: String(req.body.notes || '').trim().slice(0, 500) || null,
        }));
        await emitHearseDataChanged(req, 'fuel_deposit_recorded', { amount, transactionDate });
        const pool = await getHearsePool();
        res.status(201).json({ success: true, ...await getSummary(pool, tenantKey, getTenantSlug(req)) });
    } catch (error) {
        sendError(res, error, 'Unable to record the cheque deposit.');
    }
});








export const allocateFuelFunds = asyncHandler(async (req: Request, res: Response) => {
    const tenantKey = requireTenant(req, res);
    if (!tenantKey) return;
    const amount = validAmount(req.body.amount);
    const hearseId = Number(req.body.hearse_id);
    const transactionDate = validDate(req.body.transaction_date);
    if (!amount || !Number.isInteger(hearseId) || hearseId < 1 || !transactionDate) {
        res.status(400).json({ success: false, message: 'Enter a valid vehicle, allocation amount and date.' });
        return;
    }
    try {
        await withLockedWallet(tenantKey, async (connection) => {
            const available = await getAvailableToAllocate(connection, tenantKey);
            if (Math.round(Number(amount) * 100) > Math.round(available * 100)) {
                throw new WalletError(400, 'Allocation exceeds the unallocated TotalEnergies balance.');
            }
            const hearse = await getHearseCard(connection, tenantKey, hearseId, getTenantSlug(req));
            await recordTransaction(connection, tenantKey, {
                type: 'allocation',
                amount,
                transactionDate,
                hearse,
                reference: String(req.body.reference || '').trim().slice(0, 120) || null,
                notes: String(req.body.notes || '').trim().slice(0, 500) || null,
            });
        });
        await emitHearseDataChanged(req, 'fuel_funds_allocated', { hearseId, amount, transactionDate });
        const pool = await getHearsePool();
        res.status(201).json({ success: true, ...await getSummary(pool, tenantKey, getTenantSlug(req)) });
    } catch (error) {
        sendError(res, error, 'Unable to allocate fuel-card funds.');
    }
});





export const recordFuelPurchase = asyncHandler(async (req: Request, res: Response) => {
    const tenantKey = requireTenant(req, res);
    if (!tenantKey) return;
    const amount = validAmount(req.body.amount);
    const hearseId = Number(req.body.hearse_id);
    const transactionDate = validDate(req.body.transaction_date);
    const station = String(req.body.station || '').trim().slice(0, 150);
    if (!amount || !Number.isInteger(hearseId) || hearseId < 1 || !transactionDate || !station) {
        res.status(400).json({ success: false, message: 'Enter a valid vehicle, purchase amount, station and date.' });
        return;
    }
    try {
        await withLockedWallet(tenantKey, async (connection) => {
            const hearse = await getHearseCard(connection, tenantKey, hearseId, getTenantSlug(req));
            const cardBalance = await getCardBalance(connection, tenantKey, hearse.fuel_card_number);
            if (Math.round(Number(amount) * 100) > Math.round(cardBalance * 100)) {
                throw new WalletError(400, 'Fuel purchase exceeds this card’s available balance.');
            }
            await recordTransaction(connection, tenantKey, {
                type: 'fuel_purchase',
                amount,
                transactionDate,
                hearse,
                station,
                reference: String(req.body.reference || '').trim().slice(0, 120) || null,
                notes: String(req.body.notes || '').trim().slice(0, 500) || null,
            });
        });
        await emitHearseDataChanged(req, 'fuel_purchase_recorded', { hearseId, amount, transactionDate });
        const pool = await getHearsePool();
        res.status(201).json({ success: true, ...await getSummary(pool, tenantKey, getTenantSlug(req)) });
    } catch (error) {
        sendError(res, error, 'Unable to record the fuel purchase.');
    }
});



export const getDriverFuelCards = asyncHandler(async (req: Request, res: Response) => {
    const tenantKey = requireTenant(req, res);
    if (!tenantKey) return;
    const driver = getDriverContext(req, res);
    if (!driver) return;
    try {
        const pool = await getHearsePool();
        res.json({ success: true, ...await getDriverFuelSummary(pool, tenantKey, driver.ids, getTenantSlug(req)) });
    } catch (error) {
        sendError(res, error, 'Unable to load your assigned fuel card.');
    }
});


export const recordDriverFuelPurchase = asyncHandler(async (req: Request, res: Response) => {
    const tenantKey = requireTenant(req, res);
    if (!tenantKey) return;
    const driver = getDriverContext(req, res);
    if (!driver) return;
    const amount = validAmount(req.body.amount);
    const hearseId = Number(req.body.hearse_id);
    const transactionDate = validDate(req.body.transaction_date);
    const station = String(req.body.station || '').trim().slice(0, 150);
    if (!amount || !Number.isInteger(hearseId) || hearseId < 1 || !transactionDate || !station) {
        res.status(400).json({ success: false, message: 'Enter a valid vehicle, fuelling amount, station and date.' });
        return;

    }
    try {
        const tenantSlug = getTenantSlug(req);
        const user = (req as any).user || {};
        const driverName = String(user.name || user.full_name || user.driver_name || '').trim();
        let hearsePlate = '';
        await withLockedWallet(tenantKey, async (connection) => {
            const tenantScope = hearseTenantScope(tenantKey, '', tenantSlug);
            const [rows]: any = await connection.query(
                `SELECT id, plate_number, fuel_card_number
                 FROM hearses
                 WHERE id = ? AND ${tenantScope.clause} FOR UPDATE`,
                [hearseId, ...tenantScope.params]
            );
            const hearse = rows[0];
            if (!hearse) throw new WalletError(403, 'This vehicle is not assigned to your driver account.');
            hearsePlate = String(hearse.plate_number || '');
            const [legacyRows]: any = await connection.query(
                `SELECT id FROM hearses
                 WHERE id = ? AND ${tenantScope.clause} AND driver_id IN (?)`,
                [hearseId, ...tenantScope.params, driver.ids]
            );
            if (!legacyRows.length) {
                const [bookingRows]: any = await connection.query(
                    `SELECT hb.booking_dates, hb.booking_date, hb.from_timestamp, hb.to_timestamp
                     FROM hearse_bookings hb
                     WHERE hb.hearse_id = ? AND hb.driver_id IN (?)
                       AND ${hearseTenantScope(tenantKey, 'hb', tenantSlug).clause}
                       AND hb.status IN ('pending', 'booked', 'confirmed', 'in_transit', 'transit', 'reserved', 'in_progress')
                     FOR UPDATE`,
                    [hearseId, driver.ids, ...hearseTenantScope(tenantKey, 'hb', tenantSlug).params]
                );
                const isAssignedForDate = bookingRows.some((booking: any) =>
                    extractRowDates(booking).includes(transactionDate)
                );
                if (!isAssignedForDate) {
                    throw new WalletError(403, 'This vehicle is not assigned to you for the selected date.');
                }
            }
            const cardNumber = String(hearse.fuel_card_number || '').trim();
            if (!cardNumber) throw new WalletError(400, 'No fuel card is assigned to this vehicle.');
            const cardBalance = await getCardBalance(connection, tenantKey, cardNumber);
            if (Math.round(Number(amount) * 100) > Math.round(cardBalance * 100)) {
                throw new WalletError(400, 'Fuelling amount exceeds this card’s available balance.');
            }
            await recordTransaction(connection, tenantKey, {
                type: 'fuel_purchase',
                amount,
                transactionDate,
                hearse: { ...hearse, fuel_card_number: cardNumber },
                driverId: driver.primaryId,
                station,
                reference: String(req.body.reference || '').trim().slice(0, 120) || null,
                notes: [
                    driverName ? `Driver fuelling by: ${driverName}` : 'Driver fuelling',
                    String(req.body.notes || '').trim(),
                ].filter(Boolean).join(' · ').slice(0, 500),
            });
        });
        await emitHearseDataChanged(req, 'driver_fuel_purchase', {
            hearseId,
            plateNumber: hearsePlate,
            amount,
            transactionDate,
            station,
            driverId: driver.primaryId,
            driverName,
        });
        const pool = await getHearsePool();
        res.status(201).json({ success: true, ...await getDriverFuelSummary(pool, tenantKey, driver.ids, tenantSlug) });
    } catch (error) {
        sendError(res, error, 'Unable to record the fuelling.');
    }
});

export const updateFuelThreshold = asyncHandler(async (req: Request, res: Response) => {
    const tenantKey = requireTenant(req, res);
    if (!tenantKey) return;
    const threshold = String(req.body.low_balance_threshold ?? '').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(threshold) || !Number.isFinite(Number(threshold)) || Number(threshold) > 100000000) {
        res.status(400).json({ success: false, message: 'Enter a valid low-balance threshold in KES.' });
        return;
    }

    try {
        const pool = await getHearsePool();
        await ensureAccount(pool, tenantKey);
        await pool.query(
            'UPDATE hearse_fuel_accounts SET low_balance_threshold = ? WHERE tenant_key = ?',
            [Number(threshold).toFixed(2), tenantKey]
        );
        await emitHearseDataChanged(req, 'fuel_threshold_updated', { threshold: Number(threshold).toFixed(2) });
        res.json({ success: true, ...await getSummary(pool, tenantKey, getTenantSlug(req)) });
    } catch (error) {
        sendError(res, error, 'Unable to update the low-balance threshold.');
    }
});
