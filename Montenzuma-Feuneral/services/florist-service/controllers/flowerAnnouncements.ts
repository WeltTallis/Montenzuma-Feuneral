import { safeExecute, safeQuery } from '../database.ts';

const tenantContext = (req: any): { tenantId: string | null; tenantSlug: string | null } => ({
    tenantId: req.tenantId || req.headers?.['x-tenant-id'] || req.headers?.['x-tenant_id'] || null,
    tenantSlug: req.tenant?.tenant_slug || req.tenantSlug || null,
});

const tenantFilter = (tenantId: string | null, tenantSlug: string | null) => {
    if (tenantId) {
        return {
            clause: '(tenant_id = ? OR (tenant_id IS NULL AND tenant_slug = ?))',
            params: [tenantId, tenantSlug || ''],
        };
    }
    if (tenantSlug && tenantSlug !== 'system_shared') {
        return { clause: 'tenant_slug = ?', params: [tenantSlug] };
    }
    return null;
};

export const getFlowerAnnouncements = async (req: any, res: any) => {
    try {
        const { tenantId, tenantSlug } = tenantContext(req);
        const scope = tenantFilter(tenantId, tenantSlug);
        if (!scope) {
            return res.status(400).json({ success: false, message: 'Tenant context is required' });
        }

        const announcements = await safeQuery(
            `SELECT id, title, message, created_by, created_at
             FROM flower_announcements
             WHERE ${scope.clause}
             ORDER BY created_at DESC, id DESC
             LIMIT 50`,
            scope.params
        );
        return res.status(200).json({ success: true, data: announcements });
    } catch (error: any) {
        console.error('[FLORIST] Failed to load announcements:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to load announcements' });
    }
};

export const createFlowerAnnouncement = async (req: any, res: any) => {
    try {
        const { tenantId, tenantSlug } = tenantContext(req);
        if (!tenantSlug || tenantSlug === 'system_shared') {
            return res.status(400).json({ success: false, message: 'Tenant context is required' });
        }

        const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
        const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
        if (!title || title.length > 120 || !message || message.length > 3000) {
            return res.status(400).json({
                success: false,
                message: 'Enter a title (up to 120 characters) and message (up to 3000 characters)'
            });
        }

        const user = req.user || {};
        const createdBy = String(user.name || user.fullName || user.email || user.username || 'Team member').slice(0, 255);
        const result = await safeExecute(
            `INSERT INTO flower_announcements (tenant_slug, tenant_id, title, message, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            [tenantSlug, tenantId, title, message, createdBy]
        );

        const [announcement] = await safeQuery(
            `SELECT id, title, message, created_by, created_at
             FROM flower_announcements
             WHERE id = ? AND tenant_slug = ?
             LIMIT 1`,
            [result.insertId, tenantSlug]
        );
        if (!announcement) {
            return res.status(500).json({ success: false, message: 'Announcement was saved but could not be loaded' });
        }
        return res.status(201).json({ success: true, data: announcement });
    } catch (error: any) {
        console.error('[FLORIST] Failed to create announcement:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to create announcement' });
    }
};
