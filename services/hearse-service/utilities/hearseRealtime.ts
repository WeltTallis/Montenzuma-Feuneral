import axios from 'axios';
import { Request } from 'express';

export async function emitHearseDataChanged(
    req: Request,
    changeType: string,
    details: Record<string, unknown> = {}
): Promise<void> {
    const headerSlug = req.headers['x-tenant-slug'];
    const tenantSlug = String(
        (req as any).tenantSlug
        || (req as any).user?.tenantSlug
        || (req as any).user?.tenant_slug
        || (Array.isArray(headerSlug) ? headerSlug[0] : headerSlug)
        || ''
    ).trim();
    if (!tenantSlug) {
        console.error(`[hearse-realtime] Cannot publish ${changeType}: tenant slug is missing.`);
        return;
    }

    const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
    try {
        await axios.post(`${socketioServiceUrl}/emit/hearse_data_changed`, {
            tenantSlug,
            data: { changeType, ...details },
        }, { timeout: 3000 });
    } catch (error: any) {
        console.warn(`[hearse-realtime] Failed to publish ${changeType}:`, error?.message || error);
    }
}
