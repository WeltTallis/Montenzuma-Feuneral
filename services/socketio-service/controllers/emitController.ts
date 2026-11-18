import { NextFunction, Request, Response } from 'express';
import { AppError } from './errors';
import { SocketHttpContext } from './context';

interface EmitBody { tenantSlug?: string; data?: Record<string, any>; target?: string | string[]; branchSlugs?: string[]; }
const NO_PREFIX_EVENTS = ['ticket_response', 'ticket_updated', 'onboarding-progress', 'hearse_data_changed'];

export const emitController = (context: SocketHttpContext) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { event } = req.params;
    const { tenantSlug, data, target, branchSlugs } = req.body as EmitBody;
    if (!event || typeof event !== 'string') throw new AppError('Invalid event name', 400);
    if (!tenantSlug) throw new AppError('tenantSlug is required', 400);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new AppError('Data must be a valid object', 400);
    if (!/^[a-zA-Z0-9\-_]+$/.test(event)) throw new AppError('Invalid event name format', 400);
    if (!/^[a-z0-9-]+$/.test(tenantSlug)) throw new AppError('Invalid tenant slug format', 400);
    if (target && typeof target !== 'string' && (!Array.isArray(target) || target.some((room) => typeof room !== 'string'))) throw new AppError('Target must be a string or array of strings', 400);
    if (!target && Array.isArray(branchSlugs) && branchSlugs.length > 0 && !branchSlugs.some((slug) => typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug))) throw new AppError('No valid branch slugs provided', 400);

    const eventName = NO_PREFIX_EVENTS.includes(event) ? event : `notification:${event}`;
    const payload = { ...data, timestamp: new Date().toISOString() };
    if (requiresPersistence(eventName)) await persistNotification(context, tenantSlug, eventName, data);

    if (target) {
      if (typeof target === 'string') context.io.to(target).emit(eventName, payload);
      else context.io.in(target).emit(eventName, payload);
    } else if (Array.isArray(branchSlugs) && branchSlugs.length > 0) {
      const rooms = branchSlugs.filter((slug): slug is string => /^[a-z0-9-]+$/.test(slug)).map((slug) => `tenant_${slug}`);
      if (!rooms.length) throw new AppError('No valid branch slugs provided', 400);
      context.io.in(rooms).emit(eventName, payload);
    } else if (tenantSlug === 'system' || tenantSlug === 'all') context.io.emit(eventName, payload);
    else context.io.in(context.resolveOrgRooms(tenantSlug)).emit(eventName, payload);

    context.logger.info({ message: `Emitted ${eventName} to tenant ${tenantSlug}` });
    res.json({ success: true, event: eventName, tenantSlug, deliveryScope: context.redisConnected() ? 'cluster' : 'local_only', timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
};

const requiresPersistence = (eventName: string): boolean => eventName.startsWith('notification:') || eventName.startsWith('alert:') || eventName.startsWith('new_booking') || eventName.startsWith('booking_');

async function persistNotification(context: SocketHttpContext, tenantSlug: string, eventName: string, data: Record<string, any>): Promise<void> {
  const client = context.pubClient();
  if (!context.redisConnected() || !client?.isReady) throw new AppError('Notification storage is temporarily unavailable', 503, null, 'REDIS_UNAVAILABLE');
  const notifId = data.id || `notif-${Date.now()}`;
  const value = JSON.stringify({ id: notifId, title: data.title || eventName, message: data.message || `New event: ${eventName}`, type: data.type || 'info', priority: data.priority || 'low', fullContent: data.fullContent || data.details || data.message || '', data, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), read: false, delivered: false });
  try {
    const tenants = new Set(['restpoint', 'default', 'main', 'system', 'system_shared']);
    if (tenantSlug === 'system' || tenantSlug === 'all') context.userRooms.forEach((user) => tenants.add(user.tenantSlug));
    else { tenants.clear(); tenants.add(tenantSlug); }
    await Promise.all(Array.from(tenants, (tenant) => client.setEx(`notifications:${tenant}:socketio:${notifId}`, 86400, value)));
  } catch (error) { context.logger.error({ message: 'Failed to store notification in Redis', error }); throw new AppError('Notification could not be persisted; please retry', 503, null, 'REDIS_WRITE_FAILED'); }
}
