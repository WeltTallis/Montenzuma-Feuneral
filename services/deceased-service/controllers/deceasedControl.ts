import { getKenyaTimeISO, getKenyaDate } from '../../../packages/shared-utils/dist/timestamps';
import redisService from '../../../packages/shared-services/dist/redisService';
import { safeTenantQuery, safeTenantExecute, resolveDatabase } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/src/index';
import generateUniqueDeceasedId from '../utils/deceasedId';
import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import * as crypto from 'crypto';

const SERVICE_NAME = 'deceased-service';

// One-time guard: tracks which tenant DBs have already had charge_settings
// created this process lifetime — avoids a DDL roundtrip on every profile load.
const chargeSettingsInitialized = new Set<string>();

// TYPES

interface TenantRequest extends Request {
    tenantSlug?: string;
    dbName?: string | null;
    user?: { email?: string; id?: number };
}


// GET ALL DECEASED

export const getAllDeceased = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const dbName = (req as any).tenant?.db_name;
        const tenantId = (req as any).tenant?.id ?? (req as any).tenant?.tenant_id;
        const tenantSlug = (req as any).tenantSlug || "unknown";

        if (!dbName || tenantId === undefined || tenantId === null) {
            return res.status(400).json({
                success: false,
                message: "Tenant information missing"
            });
        }

        const {
            search = "",
            q = "",
            page = "1",
            limit = "50",
            year = "",
            month = ""
        } = req.query;

        // Optional calendar scoping (horizontal calendar fetches per year)
        const yearParam = year && Number.isFinite(Number(year)) ? Number(year) : null;
        const monthParam = month && Number.isFinite(Number(month)) ? Number(month) : null;

        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(Math.max(Number(limit) || 50, 1), 100);

        // deceasedApi.search() sends ?q=, other callers send ?search= — support both.
        const searchTerm = (typeof search === "string" && search.trim())
            ? search
            : (typeof q === "string" ? q : "");

        // REDIS CACHE KEY

        const cacheKey = `deceased:list:${tenantId}:page:${pageNumber}:limit:${limitNumber}:search:${searchTerm}:year:${yearParam}:month:${monthParam}`;

        // Try to get from cache
        const cached = await redisService.serviceGet('deceased-service', tenantSlug, cacheKey);

        if (cached) {
            Logger.info({ message: "Deceased records served from Redis" });
            return res.status(200).json({
                success: true,
                source: "cache",
                ...cached
            });
        }
        // DATABASE QUERY
        const offset = (pageNumber - 1) * limitNumber;
        let whereClause = ``;
        const params: any[] = [];

        if (searchTerm) {
            whereClause = `WHERE (full_name LIKE ? OR deceased_id LIKE ?)`;
            const keyword = `%${searchTerm}%`;
            params.push(keyword, keyword);
        }

        // Calendar scoping: /deceased-all?year=2025&month=3
        if (yearParam) {
            whereClause += whereClause
                ? ` AND YEAR(COALESCE(date_admitted, created_at)) = ?`
                : `WHERE YEAR(COALESCE(date_admitted, created_at)) = ?`;
            params.push(yearParam);
        }
        if (monthParam) {
            whereClause += whereClause
                ? ` AND MONTH(COALESCE(date_admitted, created_at)) = ?`
                : `WHERE MONTH(COALESCE(date_admitted, created_at)) = ?`;
            params.push(monthParam);
        }

        const countQuery = `SELECT COUNT(*) total FROM deceased ${whereClause}`;
        const countResult = await safeTenantQuery(dbName, countQuery, params);
        const total = Number((countResult as any)[0]?.total || 0);

        const query = `
            SELECT *
            FROM deceased
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        const records = await safeTenantQuery(dbName, query, [...params, limitNumber, offset]);

        const responseData = {
            success: true,
            source: "database",
            data: records || [],
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber)
            }
        };

        // SAVE TO REDIS with shorter TTL for faster updates
        // Reduced from 300 (5 min) to 60 (1 minute) seconds for more responsive updates
        await redisService.serviceSet(
            'deceased-service',
            tenantSlug,
            cacheKey,
            responseData,
            60 // 1 minute TTL - faster propagation of new records
        );

        return res.status(200).json(responseData);

    } catch (error: any) {
        console.error('[DECEASED] getAllDeceased raw error:', error?.message || error?.sqlMessage || JSON.stringify(error));
        Logger.error({
            message: "getAllDeceased failed",
            error: error?.message || error?.sqlMessage || String(error)
        });
        return res.status(500).json({
            success: false,
            message: error?.sqlMessage || error?.message || "Internal server error"
        });
    }
};


// GET DECEASED BY ID

export const getDeceasedById = async (req: Request, res: Response): Promise<Response> => {
    const rawId = req.params.id;
    const id = (() => {
        if (Array.isArray(rawId)) return rawId.length > 0 ? String(rawId[0]) : '';
        if (typeof rawId === 'string') return rawId;
        if (rawId != null) return String(rawId);
        return '';
    })();

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Invalid request: id required'
        });
    }

    try {
        const dbName = (req as any).tenant?.db_name;
        const tenantSlug = (req as any).tenantSlug || "unknown";

        if (!dbName) {
            return res.status(400).json({
                success: false,
                message: 'No database configured. Please provide x-tenant-slug header.'
            });
        }

        // Try cache first — the FULL merged payload (record + current charges) is
        // cached so repeated profile views are served straight from Redis.
        // KEY MUST include tenantSlug so it lives under the
        // service:deceased-service:tenant:<slug>:* namespace that
        // clearServiceCache() scans. Without it the key is never invalidated
        // on update/delete and never matches a cache hit after a clear.
        const cacheKey = `deceased:detail:${tenantSlug}:${id}`;
        const cached = await redisService.serviceGet('deceased-service', tenantSlug, cacheKey);

        let deceased: any = null;
        if (cached) {
            deceased = cached;
            Logger.info({ message: `Deceased ${id} served from Redis` });
        }

        if (!deceased) {
            const isNumeric = /^\d+$/.test(id);
            const query = `
                SELECT *
                FROM deceased
                WHERE ${isNumeric ? 'id = ?' : 'deceased_id = ?'}
                LIMIT 1
            `;

            const records = await safeTenantQuery(dbName, query, [isNumeric ? parseInt(id, 10) : id]);
            deceased = records && records.length > 0 ? records[0] : null;
        }

        if (!deceased) {
            return res.status(404).json({
                success: false,
                message: 'Deceased record not found'
            });
        }

        // ─── LIVE CHARGE SETTINGS MERGE ──────────────────────────────────────
        // The frontend sidebar/profile shows "daily storage rate" from
        // deceased.charges.storage_rate. Without this merge it always falls
        // back to the hard-coded KES 500/day no matter what was saved under
        // Charge Settings.
        //
        // PERFORMANCE FIX: `CREATE TABLE IF NOT EXISTS` is a DDL statement that
        // acquires a metadata lock and writes to the binary log EVEN when the
        // table already exists. Running it on every profile load caused severe
        // latency (100-300ms per request). We now use a per-process Set to
        // remember which tenant DBs have had the table created, so the CREATE
        // only fires once per process lifetime (i.e., once after a cold deploy).
        try {
            let chargeRows: any[];
            if (!chargeSettingsInitialized.has(dbName)) {
                // First access for this DB in this process — ensure table exists.
                try {
                    chargeRows = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', [id])) || [];
                    chargeSettingsInitialized.add(dbName); // table exists, mark as done
                } catch (chargeErr: any) {
                    const tableMissing = /doesn't exist|ER_NO_SUCH_TABLE|1146/i.test(
                        String(chargeErr?.message || chargeErr?.sqlMessage || '')
                    );
                    if (!tableMissing) throw chargeErr;
                    await safeTenantExecute(dbName, `
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
                    `, []);
                    chargeSettingsInitialized.add(dbName);
                    chargeRows = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', [id])) || [];
                }
            } else {
                // Table is known to exist — just query, no DDL overhead.
                chargeRows = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', [id])) || [];
            }
            let chargeIsDefault = false;
            if (!chargeRows || chargeRows.length === 0) {
                chargeRows = (await safeTenantQuery(dbName, 'SELECT * FROM charge_settings WHERE deceased_id = ?', ['__DEFAULT__'])) || [];
                chargeIsDefault = chargeRows.length > 0;
            }
            if (chargeRows && chargeRows.length > 0) {
                const cs = chargeRows[0];
                deceased.charges = {
                    storage_rate: Number(cs.daily_rate ?? cs.storage_rate ?? 500),
                    per_day: Number(cs.daily_rate ?? cs.storage_rate ?? 500),
                    per_hour: Number(cs.hourly_rate ?? cs.per_hour ?? 125),
                    currency: cs.currency ?? 'KES',
                    rate_profile: cs.rate_profile ?? 'standard',
                    charge_type: cs.charge_type ?? 'daily',
                    usd_rate: Number(cs.usd_rate ?? 130),
                    is_default: chargeIsDefault,
                    source: chargeIsDefault ? 'home_default' : 'deceased_specific',
                    updated_at: cs.updated_at ?? null
                };
            }
        } catch (e) { /* charge settings are optional — never block the profile */ }

        // Cache the FINAL merged payload (10-minute TTL). Updates/deletes call
        // clearServiceCache() which wipes this key together with every list key.
        // The key already includes tenantSlug so serviceSet stores it as:
        //   service:deceased-service:tenant:<slug>:deceased:detail:<slug>:<id>
        // which is matched by the clearServiceCache SCAN pattern.
        await redisService.serviceSet(
            'deceased-service',
            tenantSlug,
            cacheKey,
            deceased,
            600 // 10 minutes TTL
        );

        return res.status(200).json({
            success: true,
            message: 'Deceased record fetched successfully',
            data: deceased
        });

    } catch (error: any) {
        Logger.error('getDeceasedById error: ' + (error as Error).message);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================
// UPDATE DECEASED
// ============================================
export const updateDeceased = async (req: Request, res: Response): Promise<Response> => {
    const rawId = req.params.id;
    const id = (() => {
        if (Array.isArray(rawId)) return rawId.length > 0 ? String(rawId[0]) : '';
        if (typeof rawId === 'string') return rawId;
        if (rawId != null) return String(rawId);
        return '';
    })();

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Invalid request: id required'
        });
    }

    try {
        const dbName = (req as any).tenant?.db_name;
        const tenantSlug = (req as any).tenantSlug || "unknown";
        const tenantId = (req as any).tenant?.id;

        if (!dbName) {
            return res.status(400).json({
                success: false,
                message: 'No database configured. Please provide x-tenant-slug header.'
            });
        }

        const updates = req.body;
        const isNumeric = /^\d+$/.test(id);

        // Check if record exists
        const checkQuery = `
            SELECT deceased_id FROM deceased 
            WHERE ${isNumeric ? 'id = ?' : 'deceased_id = ?'} 
        `;
        const checkResult = await safeTenantQuery(dbName, checkQuery, [isNumeric ? parseInt(id, 10) : id]);
        if (!checkResult || (checkResult as any[]).length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Deceased record not found'
            });
        }

        // Allowed fields
        const allowedFields = new Set([
            'full_name', 'cause_of_death', 'location', 'status',
            'burial_location', 'burial_date', 'total_mortuary_charge',
            'extra_charges_amount', 'is_embalmed', 'dispatch_date',
            'county', 'place_of_death', 'gender'
        ]);

        const fields: string[] = [];
        const values: any[] = [];

        for (const [field, value] of Object.entries(updates)) {
            if (allowedFields.has(field) && value !== undefined) {
                fields.push(`${field} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        values.push(isNumeric ? parseInt(id, 10) : id);
        const updateQuery = `
            UPDATE deceased 
            SET ${fields.join(', ')}, updated_at = NOW() 
            WHERE ${isNumeric ? 'id = ?' : 'deceased_id = ?'} 
            LIMIT 1
        `;
        await safeTenantExecute(dbName, updateQuery, values);

        // Invalidate cache — wipe EVERY key for this service+tenant (detail,
        // list, stats). The old exact-key deletes could never match the real
        // list keys (`deceased:list:<tid>:page:...`), so stale rows lingered.
        try {
            await redisService.clearServiceCache('deceased-service', tenantSlug);
        } catch (cacheError) {
            Logger.warn({
                message: `Failed to invalidate deceased cache during update`,
                error: cacheError.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Deceased record updated successfully',
            data: {
                id,
                updated_fields: fields.map(f => f.split('=')[0].trim())
            }
        });

    } catch (error: any) {
        Logger.error('updateDeceased error: ' + (error as Error).message);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================
// DELETE DECEASED
// ============================================
export const deleteDeceased = async (req: Request, res: Response): Promise<Response> => {
    const rawId = req.params.id;
    const id = (() => {
        if (Array.isArray(rawId)) return rawId.length > 0 ? String(rawId[0]) : '';
        if (typeof rawId === 'string') return rawId;
        if (rawId != null) return String(rawId);
        return '';
    })();

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Invalid request: id required'
        });
    }

    try {
        const dbName = (req as any).tenant?.db_name;
        const tenantSlug = (req as any).tenantSlug || "unknown";
        const tenantId = (req as any).tenant?.id;

        if (!dbName) {
            return res.status(400).json({
                success: false,
                message: 'No database configured. Please provide x-tenant-slug header.'
            });
        }

        const isNumeric = /^\d+$/.test(id);

        // Get deceased details before deletion for notification
        const checkQuery = `
            SELECT deceased_id, full_name FROM deceased 
            WHERE ${isNumeric ? 'id = ?' : 'deceased_id = ?'} 
        `;
        const checkResult = await safeTenantQuery(dbName, checkQuery, [isNumeric ? parseInt(id, 10) : id]);
        const deceasedRecord = (checkResult as any[])[0];

        const deleteQuery = `
            DELETE FROM deceased
            WHERE ${isNumeric ? 'id = ?' : 'deceased_id = ?'} 
            LIMIT 1
        `;
        const result = await safeTenantExecute(dbName, deleteQuery, [isNumeric ? parseInt(id, 10) : id]);

        // Invalidate cache — wipe EVERY key for this service+tenant.
        try {
            await redisService.clearServiceCache('deceased-service', tenantSlug);
        } catch (cacheError) {
            Logger.warn({
                message: `Failed to invalidate deceased cache during deletion`,
                error: cacheError.message
            });
        }

        // Emit notification for deceased removal
        try {
            const axios = require('axios');
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            await axios.post(`${socketioServiceUrl}/emit/deceased-removed`, {
                tenantSlug,
                data: {
                    id: `deceased-removed-${id}-${Date.now()}`,
                    deceasedId: id,
                    fullName: deceasedRecord?.full_name || 'Unknown',
                    title: 'Record Removed',
                    message: `Deceased record removed: ${deceasedRecord?.full_name || id}`,
                    type: 'removal',
                    priority: 'low',
                    fullContent: `Deceased record has been removed from the system.\nID: ${id}`,
                }
            }, { timeout: 5000 });
            Logger.info({ message: `Emitted deceased-removed for ${id}` });
        } catch (emitError: any) {
            Logger.warn({
                message: `Failed to emit deceased-removed notification`,
                error: emitError.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Deceased record deleted successfully'
        });

    } catch (error: any) {
        Logger.error('deleteDeceased error: ' + (error as Error).message);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================
// UPDATE DECEASED STATUS (for cross-service calls)
// ============================================
export const updateDeceasedStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { admission_number, deceased_id, body_status, is_embalmed } = req.body || {};
        const tenantSlug = ((req.headers['x-slug'] as string) || (req.headers['x-tenant-slug'] as string) || (req as any).tenantSlug || 'system_shared');
        const dbName = (req as any).tenant?.db_name || await resolveDatabase(tenantSlug);

        if (!dbName) {
            return res.status(400).json({
                success: false,
                message: 'No database configured for this tenant'
            });
        }

        if (!admission_number && !deceased_id) {
            return res.status(400).json({
                success: false,
                message: 'Admission number or deceased ID is required'
            });
        }

        const canonicalBodyStatus = (() => {
            const raw = String(body_status ?? '').trim();
            if (!raw) return null;
            const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

            const aliases: Record<string, string> = {
                admitted: 'In Morgue',
                active: 'In Morgue',
                'in morgue': 'In Morgue',
                morgue: 'In Morgue',
                received: 'In Morgue',
                'under care': 'In Morgue',
                'in care': 'In Morgue',
                embalmed: 'In Morgue',
                'postmortem requested': 'Postmortem Requested',
                'post mortem requested': 'Postmortem Requested',
                'pending autopsy': 'Postmortem Requested',
                'postmortem done': 'Postmortem Done',
                'post mortem done': 'Postmortem Done',
                completed: 'Postmortem Done',
                released: 'Released',
                'released to family': 'Released',
                transferred: 'Transferred',
                transfer: 'Transferred',
                dispatched: 'Released',
                buried: 'Buried',
                'ready for collection': 'Released',
                ready: 'Released',
                pending: 'In Morgue',
            };

            return aliases[normalized] || raw;
        })();

        // Build dynamic update query.
        // NOTE: the deceased table has NO `is_embalmed` column (embalming is
        // tracked via admission_status). Writing is_embalmed used to throw
        // "Unknown column" and silently cancel the whole status update, so
        // released bodies never showed as Released on the deceased list.
        const updates: string[] = [];
        const values: any[] = [];

        if (is_embalmed === true) {
            updates.push(`admission_status = IF(admission_status = 'admitted', 'embalmed', admission_status)`);
        }

        if (canonicalBodyStatus) {
            updates.push('body_status = ?');
            values.push(canonicalBodyStatus);

            const bs = String(canonicalBodyStatus).toLowerCase();
            if (bs === 'released' || bs === 'transferred' || bs === 'buried') {
                updates.push(`release_status = 'released'`);
                updates.push(`admission_status = ?`);
                values.push(bs === 'buried' ? 'buried' : bs === 'transferred' ? 'released' : 'released');
                updates.push('dispatch_date = COALESCE(dispatch_date, CURDATE())');
            } else if (bs === 'postmortem requested' || bs === 'postmortem done') {
                updates.push('release_status = ?');
                values.push('pending');
            }
        }

        updates.push('updated_at = NOW()');

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        const whereField = deceased_id ? 'deceased_id = ?' : 'admission_number = ?';
        const whereValue = deceased_id || admission_number;
        values.push(whereValue);

        const updateQuery = `
            UPDATE deceased 
            SET ${updates.join(', ')} 
            WHERE ${whereField}
        `;

        await safeTenantExecute(dbName, updateQuery, values);

        try {
            await redisService.clearServiceCache('deceased-service', tenantSlug);
        } catch (cacheError: any) {
            Logger.warn({
                message: `Failed to invalidate deceased cache during status update`,
                error: cacheError?.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Deceased status updated successfully'
        });

    } catch (error: any) {
        Logger.error('updateDeceasedStatus error: ' + (error as Error).message);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============================================
// EXPORT ALL
// ============================================
export default {
    getAllDeceased,
    getDeceasedById,
    updateDeceased,
    deleteDeceased,
    updateDeceasedStatus
};