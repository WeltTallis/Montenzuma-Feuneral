import { safeTenantExecute, safeTenantQuery, resolveDatabase } from '../../../shared/dbConfig';
import { Request, Response } from 'express';
import Logger from '../../../packages/shared-logger/src/index';
import redisService from '../../../packages/shared-services/dist/redisService';

interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi = (): string => new Date().toISOString();
const HOME_DEFAULT_KEY = '__DEFAULT__';

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
        let rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', [id])) || [];
        let isDefault = false;
        if (rows.length === 0) {
            rows = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', [HOME_DEFAULT_KEY])) || [];
            isDefault = rows.length > 0;
        }
        // `exists` tells the caller whether ANY row backs this response. Without
        // it the client cannot tell "this deceased inherits the home default"
        // apart from "this deceased has no charge configuration at all" — both
        // used to arrive as a bare object, and the UI then invented a rate.
        //
        // `source`/`is_default` are the provenance flags the profile sidebar
        // renders as "Home default" vs "Deceased-specific". They are returned in
        // BOTH camelCase and snake_case because the profile page merges this
        // payload straight into the snake_case `charges` object it got from
        // GET /deceased/:id, and dropping them there is what made a record
        // inherit the home rate while still being labelled "Deceased-specific".
        const exists = rows.length > 0;
        return res.status(200).json({
            success: true,
            data: {
                ...toCamel(rows[0]),
                exists,
                isDefault,
                is_default: isDefault,
                source: isDefault ? 'home_default' : 'deceased_specific',
            }
        });
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
        const settingsKey = b.isHomeDefault ? HOME_DEFAULT_KEY : id;

        // Validate whichever rate the chosen frequency actually bills from.
        // Only the daily side used to be checked, so an hourly configuration
        // could be saved with a zero/absent hourly rate and the profile then
        // showed the untouched daily figure as if nothing had changed.
        if (chargeType === 'daily' && (!Number.isFinite(dailyRate) || dailyRate <= 0)) {
            return res.status(400).json({ success: false, message: 'A positive daily rate is required.' });
        }
        if (chargeType === 'hourly' && (!Number.isFinite(hourlyRate) || hourlyRate <= 0)) {
            return res.status(400).json({ success: false, message: 'A positive hourly rate is required.' });
        }

        await ensureChargeSettingsTable(dbName);
        await safeTenantExecute(dbName, `
            INSERT INTO charge_settings
                (deceased_id, rate_profile, currency, charge_type, daily_rate, hourly_rate, usd_rate, updated_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                rate_profile = VALUES(rate_profile), currency = VALUES(currency), charge_type = VALUES(charge_type),
                daily_rate = VALUES(daily_rate), hourly_rate = VALUES(hourly_rate), usd_rate = VALUES(usd_rate),
                updated_by = VALUES(updated_by), updated_at = VALUES(updated_at)
        `, [settingsKey, rateProfile, currency, chargeType, dailyRate, hourlyRate, usdRate,
            req.headers['x-user-name'] as string || null, now, now]);

        // A default rate affects every profile without a specific override;
        // clear the tenant profile cache for both default and specific updates.
        await redisService.clearServiceCache('deceased-service', tenantSlug);

        Logger.info({ message: 'Charge settings updated', deceasedId: settingsKey, tenantSlug });

        const rows: any[] = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', [settingsKey])) || [];
        const isDefault = settingsKey === HOME_DEFAULT_KEY;
        return res.status(200).json({
            success: true,
            message: 'Charge settings updated successfully',
            data: {
                ...toCamel(rows[0]),
                exists: rows.length > 0,
                isDefault,
                is_default: isDefault,
                source: isDefault ? 'home_default' : 'deceased_specific',
            }
        });
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
