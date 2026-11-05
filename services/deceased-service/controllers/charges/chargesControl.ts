

import { safeTenantExecute, safeTenantQuery, resolveDatabase } from '../../../../shared/dbConfig';
import Logger from '@montezuma/shared-logger/src';
import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import { error } from 'node:console';


interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi = (): string => {
    return DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd HH:mm:ss');
};

const getTenantSlugFromReq = (req: TenantRequest): string => {
    return ((req.headers['x-slug'] as string) || (req.headers['x-tenant-slug'] as string) || req.tenantSlug || 'system_shared');
};

// ---------------------------------------------------------------------------
// Currency / method normalisation - billing on the deceased profile is USD-first
// ---------------------------------------------------------------------------
const ALLOWED_CURRENCIES = ['KES', 'USD', 'EUR', 'GBP'];
const normalizeCurrency = (c: any): string => {
    const upper = String(c || '').toUpperCase();
    return ALLOWED_CURRENCIES.includes(upper) ? upper : 'USD';
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
    'cash': 'cash',
    'card': 'card',
    'bank_transfer': 'bank_transfer',
    'bank transfer': 'bank_transfer',
    'mobile_money': 'mobile_money',
    'mobile money': 'mobile_money',
    'mpesa': 'mobile_money',
    'm-pesa': 'mobile_money',
    'check': 'check',
    'cheque': 'check',
    'insurance': 'insurance'
};
const normalizePaymentMethod = (m: any): string => {
    return PAYMENT_METHOD_MAP[String(m || '').toLowerCase().trim()] || 'cash';
};

const DISPLAY_METHOD: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'M-Pesa',
    check: 'Check',
    insurance: 'Insurance'
};

const mapChargeRow = (r: any) => ({ ...r, description: r.description ?? r.notes ?? null });
const mapPaymentRow = (r: any) => ({
    ...r,
    payment_method: DISPLAY_METHOD[r.payment_method] || r.payment_method,
    reference: r.reference_number ?? r.reference ?? null,
    description: r.notes ?? null
});

// ---------------------------------------------------------------------------
// Table guards (idempotent, FK-free so they work on fresh or migrated tenants)
// ---------------------------------------------------------------------------
const ensureExtraChargesTable = async (dbName: string): Promise<void> => {
    const sql = `
        CREATE TABLE IF NOT EXISTS extra_charges (
            charge_id INT NOT NULL AUTO_INCREMENT,
            tenant_slug VARCHAR(100) NOT NULL,
            deceased_id VARCHAR(100) NOT NULL,
            charge_type VARCHAR(100) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            currency ENUM('KES', 'USD', 'EUR', 'GBP') DEFAULT 'USD',
            service_date VARCHAR(255) NULL,
            requested_by VARCHAR(100),
            status ENUM('pending', 'approved', 'invoiced', 'paid', 'rejected', 'cancelled') DEFAULT 'pending',
            approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
            approved_by INT,
            approved_at VARCHAR(255) NULL,
            invoice_id VARCHAR(100),
            notes TEXT,
            rejection_reason TEXT,
            created_by INT,
            created_at VARCHAR(255) NULL,
            updated_at VARCHAR(255) NULL,
            is_deleted BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (charge_id),
            INDEX idx_ec_deceased_id (deceased_id),
            INDEX idx_ec_tenant_slug (tenant_slug),
            INDEX idx_ec_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await safeTenantExecute(dbName, sql, []);
};

const ensurePaymentsTable = async (dbName: string): Promise<void> => {
    const sql = `
        CREATE TABLE IF NOT EXISTS payments (
            payment_id INT AUTO_INCREMENT PRIMARY KEY,
            deceased_id VARCHAR(50) NOT NULL,
            invoice_id INT NULL,
            transaction_id VARCHAR(255),
            phone_number VARCHAR(20),
            amount DECIMAL(15, 2) NOT NULL,
            currency ENUM('KES', 'USD', 'EUR', 'GBP') DEFAULT 'USD',
            payment_method ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'check', 'insurance') DEFAULT 'cash',
            insurance_provider VARCHAR(150) NULL,
            payment_date VARCHAR(255),
            reference_number VARCHAR(100),
            receipt_number VARCHAR(100),
            status ENUM('pending', 'confirmed', 'completed', 'failed', 'refunded') DEFAULT 'completed',
            message TEXT,
            notes TEXT,
            recorded_by VARCHAR(100),
            created_at VARCHAR(255),
            updated_at VARCHAR(255),
            INDEX idx_pay_deceased_id (deceased_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await safeTenantExecute(dbName, sql, []);
    // Tables created by older migrations may miss these columns - add best-effort.
    const alters = [
        `ALTER TABLE payments ADD COLUMN recorded_by VARCHAR(100) NULL`,
        `ALTER TABLE payments ADD COLUMN insurance_provider VARCHAR(150) NULL`,
        `ALTER TABLE payments ADD COLUMN currency ENUM('KES', 'USD', 'EUR', 'GBP') DEFAULT 'USD'`
    ];
    for (const alterSQL of alters) {
        try {
            await safeTenantExecute(dbName, alterSQL, []);
        } catch (err: any) {
            // ER_DUP_FIELDNAME means column already exists - safe to ignore
            if (!/duplicate/i.test(err?.message || '') && err?.code !== 'ER_DUP_FIELDNAME') {

                Logger.warn({
                    Message: "   Message  ALTER   Skipped",
                    error: err?.message
                })

            }
        }
    }

    // Legacy tables carry payment_method as an ENUM without 'insurance' — widen
    // it once per database. Guarded via information_schema so the DDL does not
    // re-run on every request.
    try {
        const colRows: any[] = (await safeTenantQuery(
            dbName,
            `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'payment_method'`,
            [dbName]
        )) || [];
        const columnType = String(colRows[0]?.COLUMN_TYPE || colRows[0]?.column_type || '');
        if (columnType && !/insurance/i.test(columnType)) {
            await safeTenantExecute(
                dbName,
                `ALTER TABLE payments MODIFY COLUMN payment_method ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'check', 'insurance') DEFAULT 'cash'`,
                []
            );
        }
    } catch (err: any) {
        Logger.warn({
            message: "  [  CHNAGES ] Payments   method    widen   Skipped",
            error: err?.message
        })

    }
};

const resolveDbOr400 = async (req: TenantRequest, res: Response): Promise<string | null> => {
    const tenantSlug = getTenantSlugFromReq(req);
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
        res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
        return null;
    }
    return dbName;
};

// ---------------------------------------------------------------------------
// Charges - persisted per-deceased billing items (individual USD billing)
// ---------------------------------------------------------------------------

/** GET /charges/:deceased_id */
export const getCharges = async (req: TenantRequest, res: Response): Promise<Response> => {
    try {
        const { deceased_id } = req.params;
        const dbName = await resolveDbOr400(req, res);
        if (!dbName) return res as unknown as Response;

        await ensureExtraChargesTable(dbName);
        const rows: any[] = (await safeTenantQuery(
            dbName,
            'SELECT * FROM extra_charges WHERE deceased_id = ? AND is_deleted = FALSE ORDER BY charge_id DESC',
            [deceased_id]
        )) || [];

        return res.json({ success: true, data: rows.map(mapChargeRow), message: 'Charges retrieved successfully' });
    } catch (error: any) {
        Logger.error({
            message: "An    Error   Occured   While  Creating  Charges  ",
            error: error?.message
        })

        return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve charges' });
    }
};

/** POST /charges - add an individual charge for one deceased (USD unless stated) */
export const addCharge = async (req: TenantRequest, res: Response): Promise<Response> => {
    try {
        const { deceased_id, charge_type, amount, description, notes, service_date, currency, requested_by } = req.body || {};
        if (!deceased_id || !charge_type || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'deceased_id, charge_type and a positive amount are required' });
        }

        const tenantSlug = getTenantSlugFromReq(req);
        const dbName = await resolveDbOr400(req, res);
        if (!dbName) return res as unknown as Response;

        await ensureExtraChargesTable(dbName);
        const now = nowNairobi();
        const result: any = await safeTenantExecute(dbName, `
            INSERT INTO extra_charges
                (tenant_slug, deceased_id, charge_type, amount, currency, service_date, requested_by, status, approval_status, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 'not_required', ?, ?, ?)
        `, [
            tenantSlug,
            deceased_id,
            String(charge_type),
            parseFloat(amount),
            normalizeCurrency(currency),
            service_date || now.split(' ')[0],
            requested_by || null,
            description || notes || null,
            now,
            now
        ]);

        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM extra_charges WHERE charge_id = ?', [result?.insertId])) || [];
        const newCharge = mapChargeRow(rows[0] || { charge_id: result?.insertId, deceased_id, charge_type, amount: parseFloat(amount) });

        try { (global as any).io?.to(`tenant:${tenantSlug}`).emit('charge-added', newCharge); } catch { /* socket optional */ }

        return res.status(201).json({ success: true, data: newCharge, message: 'Charge added successfully' });
    } catch (error: any) {
        Logger.error({
            message: "   An   Erroor    Occured    While   Adding  Charge ",
            error: error?.message
        })

        return res.status(500).json({ success: false, message: error.message || 'Failed to add charge' });
    }
};

/** PUT /charges/:id */
export const updateCharge = async (req: TenantRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const updates: string[] = [];
        const params: any[] = [];
        const setIf = (column: string, value: any) => {
            if (value !== undefined && value !== null) { updates.push(`${column} = ?`); params.push(value); }
        };

        setIf('charge_type', body.charge_type);
        if (body.amount !== undefined && body.amount !== null) setIf('amount', parseFloat(body.amount));
        setIf('currency', body.currency ? normalizeCurrency(body.currency) : undefined);
        setIf('service_date', body.service_date);
        setIf('status', body.status);
        // The UI sends `description`; the table column is `notes`
        setIf('notes', body.description ?? body.notes);

        if (!updates.length) {
            return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
        }

        const dbName = await resolveDbOr400(req, res);
        if (!dbName) return res as unknown as Response;

        await ensureExtraChargesTable(dbName);
        updates.push('updated_at = ?');
        params.push(nowNairobi(), id);

        await safeTenantExecute(dbName, `UPDATE extra_charges SET ${updates.join(', ')} WHERE charge_id = ? AND is_deleted = FALSE`, params);

        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM extra_charges WHERE charge_id = ?', [id])) || [];
        if (!rows.length) return res.status(404).json({ success: false, message: 'Charge not found' });
        return res.json({ success: true, data: mapChargeRow(rows[0]), message: 'Charge updated successfully' });
    } catch (error: any) {
        Logger.error({
            message: " An  Error   Occured  While  Updating  Charge",
            error: error?.message

        })

        return res.status(500).json({ success: false, message: error.message || 'Failed to update charge' });
    }
};

/** DELETE /charges/:id - soft delete so audit trails stay intact */
export const deleteCharge = async (req: TenantRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const dbName = await resolveDbOr400(req, res);
        if (!dbName) return res as unknown as Response;

        await ensureExtraChargesTable(dbName);
        await safeTenantExecute(dbName, 'UPDATE extra_charges SET is_deleted = TRUE, updated_at = ? WHERE charge_id = ?', [nowNairobi(), id]);

        return res.json({ success: true, message: 'Charge deleted successfully' });
    } catch (error: any) {
        Logger.error({
            message: " An   Error   Occuured   Whle   Deliting Charge",
            error: error?.message
        })

        return res.status(500).json({ success: false, message: error.message || 'Failed to delete charge' });
    }
};

// ---------------------------------------------------------------------------
// Payments - persisted individual payments against one deceased (USD)
// ---------------------------------------------------------------------------

/** GET /payments/:deceased_id */
export const getPayments = async (req: TenantRequest, res: Response): Promise<Response> => {
    try {
        const { deceased_id } = req.params;
        const dbName = await resolveDbOr400(req, res);
        if (!dbName) return res as unknown as Response;

        await ensurePaymentsTable(dbName);
        const rows: any[] = (await safeTenantQuery(
            dbName,
            'SELECT * FROM payments WHERE deceased_id = ? ORDER BY payment_id DESC',
            [deceased_id]
        )) || [];

        return res.json({ success: true, data: rows.map(mapPaymentRow), message: 'Payments retrieved successfully' });
    } catch (error: any) {
        Logger.error({
            message: "    NA  error    Occuured   WHile   getting payments",
            error: error?.message
        })

        return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve payments' });
    }
};

/** POST /payments - record an individual payment for one deceased (USD unless stated) */
export const recordPayment = async (req: TenantRequest, res: Response): Promise<Response> => {
    try {
        const { deceased_id, amount, payment_method, reference, payment_date, description, recorded_by, currency, insurance_provider } = req.body || {};
        if (!deceased_id || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'deceased_id and a positive amount are required' });
        }

        const dbName = await resolveDbOr400(req, res);
        if (!dbName) return res as unknown as Response;

        await ensurePaymentsTable(dbName);
        const now = nowNairobi();
        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        const normalizedMethod = normalizePaymentMethod(payment_method);
        const insuranceProvider = String(insurance_provider || '').trim() || null;
        if (normalizedMethod === 'insurance' && !insuranceProvider) {
            return res.status(400).json({
                success: false,
                message: 'Insurance provider name is required for insurance payments'
            });
        }

        const result: any = await safeTenantExecute(dbName, `
            INSERT INTO payments
                (deceased_id, transaction_id, amount, currency, payment_method, insurance_provider, payment_date, reference_number, status, notes, recorded_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)
        `, [
            deceased_id,
            transactionId,
            parseFloat(amount),
            normalizeCurrency(currency),
            normalizedMethod,
            insuranceProvider,
            payment_date || now,
            reference || null,
            description || null,
            recorded_by || null,
            now,
            now
        ]);

        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM payments WHERE payment_id = ?', [result?.insertId])) || [];

        return res.status(201).json({
            success: true,
            data: mapPaymentRow(rows[0] || { payment_id: result?.insertId, deceased_id, amount: parseFloat(amount) }),
            message: 'Payment recorded successfully'
        });
    } catch (error: any) {
        Logger.error({
            mesage: "  An Error    Occured   While    recording  payment",
            error: error?.message

        })

        return res.status(500).json({ success: false, message: error.message || 'Failed to record payment' });
    }
};