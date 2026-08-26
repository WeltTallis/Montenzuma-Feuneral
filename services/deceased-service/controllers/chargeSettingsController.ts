import { Request, Response } from 'express';
import { safeTenantExecute, safeTenantQuery, resolveDatabase } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/src/index';

interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi = (): string => new Date().toISOString();

const getTenantSlugFromReq = (req: TenantRequest): string =>
    ((req.headers['x-slug'] as string) || (req.headers['x-tenant-slug'] as string) || (req as any).tenantSlug || 'system_shared');

const ensureChargeSettingsTable = async (dbName: string): Promise<void> => {
    const sql = `
        CREATE TABLE IF NOT EXISTS charge_settings (
            deceased_id VARCHAR(100) NOT NULL PRIMARY KEY,
            rate_profile VARCHAR(50) DEFAULT 'standard',
            currency ENUM('KES','USD') DEFAULT 'KES',
            charge_type ENUM('daily','hourly') DEFAULT 'daily',
            daily_rate DECIMAL(12,2) DEFAULT 3000.00,
            hourly_rate DECIMAL(12,2) DEFAULT 125.00,
            usd_rate DECIMAL(12,2) DEFAULT 130.00,
            updated_by VARCHAR(150) NULL,
            created_at VARCHAR(255) NULL,
            updated_at VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    await safeTenantExecute(dbName, sql, []);
};

const toCamel = (r: any) => r && ({
    rateProfile: r.rate_profile ?? 'standard',
    currency: r.currency ?? 'KES',
    chargeType: r.charge_type ?? 'daily',
    dailyRate: Number(r.daily_rate ?? 3000),
    hourlyRate: Number(r.hourly_rate ?? 125),
    usdRate: Number(r.usd_rate ?? 130),
    updatedBy: r.updated_by ?? null,
    updatedAt: r.updated_at ?? null,
});

// ─── GET /deceased/charge-settings/:id ──────────────────────────────────────
export const getChargeSettings = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = getTenantSlugFromReq(req);
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
        return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
    }
    try {
        const { id } = req.params;
        await ensureChargeSettingsTable(dbName);
        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', [id])) || [];
        return res.status(200).json({ success: true, data: toCamel(rows[0]) });
    } catch (error: any) {
        console.error('Error loading charge settings:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to load charge settings' });
    }
};

// ─── PUT /deceased/charge-settings/:id ──────────────────────────────────────
export const updateChargeSettings = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = getTenantSlugFromReq(req);
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
        return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
    }
    try {
        const { id } = req.params;
        const b = req.body || {};
        const now = nowNairobi();
        const rateProfile = ['standard', 'premium', 'custom'].includes(b.rateProfile) ? b.rateProfile : 'standard';
        const currency = b.currency === 'USD' ? 'USD' : 'KES';
        const chargeType = b.chargeType === 'hourly' ? 'hourly' : 'daily';
        const dailyRate = Number(b.dailyRate ?? 3000);
        const hourlyRate = Number(b.hourlyRate ?? 125);
        const usdRate = Number(b.usdRate ?? 130);

        await ensureChargeSettingsTable(dbName);
        await safeTenantExecute(dbName, `
            INSERT INTO charge_settings
                (deceased_id, rate_profile, currency, charge_type, daily_rate, hourly_rate, usd_rate, updated_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                rate_profile = VALUES(rate_profile), currency = VALUES(currency), charge_type = VALUES(charge_type),
                daily_rate = VALUES(daily_rate), hourly_rate = VALUES(hourly_rate), usd_rate = VALUES(usd_rate),
                updated_by = VALUES(updated_by), updated_at = VALUES(updated_at)
        `, [id, rateProfile, currency, chargeType, dailyRate, hourlyRate, usdRate,
            req.headers['x-user-name'] as string || null, now, now]);

        Logger.info({ message: 'Charge settings updated', deceasedId: id, tenantSlug });

        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', [id])) || [];
        return res.status(200).json({ success: true, message: 'Charge settings updated successfully', data: toCamel(rows[0]) });
    } catch (error: any) {
        console.error('Error updating charge settings:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to update charge settings' });
    }
};

export const getBillingSummary = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({
    success: true,
    message: 'Billing summary placeholder',
    data: { id: req.params.id }
  });
};

export const recalculateBalance = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({
    success: true,
    message: 'Recalculation completed',
    data: { id: req.params.id }
  });
};
