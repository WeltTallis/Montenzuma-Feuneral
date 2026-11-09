import { getKenyaTimeISO } from '@montezuma/shared-utils';
import { decorateBranchNames } from './branchNames';
import { logger } from '@montezuma/shared-logger';
import { safeQuery } from '../database';
import cron from 'node-cron';
import axios from 'axios';




interface BookingReminder {
    booking_id: number;
    booking_code: string;
    client_name: string;
    client_phone: string;
    destination: string;
    booking_dates: string;
    hearse_name: string;
    plate_number: string;
    branch_id: number;
    branch_code: string;
    tenant_db_name?: string;
}

/**
 * Notification Cron Service
 * Runs scheduled jobs to emit Socket.IO notifications for upcoming bookings
 */
export class NotificationCronService {
    private io: any;
    private isRunning: boolean = false;
    private emittedSignatures: Map<string, string> = new Map();
    private scheduledTasks: ReturnType<typeof cron.schedule>[] = [];

    constructor(io: any) {
        this.io = io;
    }

    private shouldEmit(eventName: string, tenantSlug: string, signature: string): boolean {
        const key = `${eventName}:${tenantSlug}`;
        if (this.emittedSignatures.get(key) === signature) {
            return false;
        }
        if (this.emittedSignatures.size > 200) {
            this.emittedSignatures.clear();
        }
        this.emittedSignatures.set(key, signature);
        return true;
    }

    /**
     * Stable signature for a booking set: day context + sorted booking codes
     */
    private bookingSignature(tenantBookings: any[], ...context: string[]): string {
        const codes = tenantBookings
            .map(b => String(b.booking_code ?? b.booking_id ?? ''))
            .sort()
            .join(',');
        return [...context, codes].join('|');
    }

    /**
     * Human readable client summary, e.g. "John Doe, Jane Roe +2 more"
     */
    private describeBookings(tenantBookings: any[]): string {
        const names = tenantBookings.map(b => b.client_name).filter(Boolean);
        if (names.length === 0) return '';
        const shown = names.slice(0, 3).join(', ');
        return names.length > 3 ? `${shown} +${names.length - 3} more` : shown;
    }

    /**
     * Start all cron jobs
     */
    start(): void {
        if (this.isRunning) {
            logger.info('Notification cron service is already running');
            return;
        }

        logger.info('Starting notification cron service');

        // Check upcoming bookings hourly; the reminder is deduplicated by signature.
        this.scheduledTasks.push(cron.schedule('0 * * * *', () => {
            this.checkUpcomingBookings();
        }));

        this.scheduledTasks.push(cron.schedule('*/3 * * * *', () => {
            this.checkUrgentBookings();
        }));


        this.scheduledTasks.push(cron.schedule('0 8 * * *', () => {
            this.checkWeeklyBookings();
        }));

        this.isRunning = true;

    }

    /**
     * Stop all cron jobs
     */
    stop(): void {
        this.isRunning = false;
        for (const task of this.scheduledTasks) {
            task.stop();
        }
        this.scheduledTasks = [];
    }

    /**
     * Check for bookings in the next 24 hours and emit reminders
     */
    private async checkUpcomingBookings(): Promise<void> {
        try {
            const now = getKenyaTimeISO();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const bookings = await safeQuery(
                `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone,
                        hb.destination, hb.from_location, hb.to_location, hb.booking_dates, hb.tenant_db_name,
                        hb.tenant_slug, hb.branch_slug, hb.branch_id AS booking_branch_id, hb.created_at,
                        h.hearse_name, h.plate_number, h.branch_name AS hearse_branch_name, h.branch_id, h.branch_code
                 FROM hearse_bookings hb
                 LEFT JOIN hearses h ON hb.hearse_id = h.id
                 WHERE hb.booking_dates LIKE ?
                 AND hb.status NOT IN ('completed', 'cancelled')`,
                [`%"${tomorrowStr}"%`]
            );
            await decorateBranchNames(bookings as any[]);


            const FRESH_WINDOW_MS = 60 * 60 * 1000;
            const cutoff = Date.now() - FRESH_WINDOW_MS;
            const existingBookings = (bookings as any[]).filter((b: any) => {
                if (!b?.created_at) return true;
                const created = new Date(String(b.created_at).replace(' ', 'T')).getTime();
                return Number.isNaN(created) || created < cutoff;
            });

            if (existingBookings.length > 0) {

                const tenantGroups = this.groupBookingsByTenant(existingBookings);
                for (const [tenantSlug, tenantBookings] of tenantGroups) {

                    if (!this.shouldEmit('upcoming_bookings_24h', tenantSlug, this.bookingSignature(tenantBookings, tomorrowStr))) {
                        continue;
                    }

                    const clientSummary = this.describeBookings(tenantBookings);
                    const message = clientSummary
                        ? `You have ${tenantBookings.length} booking(s) tomorrow (${tomorrowStr}): ${clientSummary}`
                        : `You have ${tenantBookings.length} booking(s) scheduled for tomorrow`;

                    this.emitNotification('upcoming_bookings_24h', {
                        type: 'reminder',
                        title: 'Upcoming Bookings Tomorrow',
                        message,
                        bookings: tenantBookings.map(b => ({
                            bookingCode: b.booking_code,
                            clientName: b.client_name,
                            clientPhone: b.client_phone,
                            destination: b.destination,
                            bookingDates: b.booking_dates,
                            hearseName: b.hearse_name || '',
                            plateNumber: b.plate_number || '',
                            branchId: b.branch_id,
                            branchCode: b.branch_code,

                            branchName: b.branch_name || ''
                        })),
                        timestamp: now
                    }, tenantSlug);
                }
            }
        } catch (error) {
            logger.error({ err: error }, 'Error checking upcoming hearse bookings');
        }
    }

    /**
     * Check for bookings in the next 2 hours and emit urgent reminders
     */
    private async checkUrgentBookings(): Promise<void> {
        try {
            const now = getKenyaTimeISO();
            const twoHoursLater = new Date();
            twoHoursLater.setHours(twoHoursLater.getHours() + 2);
            const twoHoursLaterStr = twoHoursLater.toISOString();

            const bookings = await safeQuery(
                `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone,
                        hb.destination, hb.from_location, hb.to_location, hb.booking_dates, hb.tenant_db_name,
                        hb.tenant_slug, hb.branch_slug, hb.branch_id AS booking_branch_id,
                        h.hearse_name, h.plate_number, h.branch_name AS hearse_branch_name, h.branch_id, h.branch_code
                 FROM hearse_bookings hb
                 LEFT JOIN hearses h ON hb.hearse_id = h.id
                 WHERE hb.booking_dates LIKE ?
                 AND hb.status IN ('booked', 'pending')`,
                [`%${now.split('T')[0]}%`]
            );

            // Real branch names (Nairobi / Thika / …) come from the branch registry.
            await decorateBranchNames(bookings as any[]);

            if (bookings.length > 0) {
                const tenantGroups = this.groupBookingsByTenant(bookings);
                for (const [tenantSlug, tenantBookings] of tenantGroups) {
                    if (!this.shouldEmit('urgent_bookings_2h', tenantSlug, this.bookingSignature(tenantBookings, now.split('T')[0]))) {
                        continue;
                    }

                    const clientSummary = this.describeBookings(tenantBookings);
                    const message = clientSummary
                        ? `${tenantBookings.length} booking(s) starting soon: ${clientSummary}`
                        : `${tenantBookings.length} booking(s) starting soon!`;

                    this.emitNotification('urgent_bookings_2h', {
                        type: 'urgent_reminder',
                        title: ' Urgent: Bookings in Next 2 Hours',
                        message,
                        bookings: tenantBookings.map(b => ({
                            bookingCode: b.booking_code,
                            clientName: b.client_name,
                            clientPhone: b.client_phone,
                            destination: b.destination,
                            bookingDates: b.booking_dates,
                            hearseName: b.hearse_name || 'N/A',
                            plateNumber: b.plate_number || 'N/A',
                            branchId: b.branch_id,
                            branchCode: b.branch_code,
                            branchName: b.branch_name || ''
                        })),
                        timestamp: getKenyaTimeISO()
                    }, tenantSlug);
                }
            }
        } catch (error) {
            logger.error({ err: error }, 'Error checking urgent hearse bookings');
        }
    }

    /**
     * Check for bookings in the next 7 days and emit weekly summary
     */
    private async checkWeeklyBookings(): Promise<void> {
        try {
            const now = getKenyaTimeISO();
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekStr = nextWeek.toISOString();
            const bookings = await safeQuery(
                `SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone,
                        hb.destination, hb.from_location, hb.to_location, hb.booking_dates, hb.tenant_db_name,
                        hb.tenant_slug, hb.branch_slug, hb.branch_id AS booking_branch_id,
                        h.hearse_name, h.plate_number, h.branch_name AS hearse_branch_name, h.branch_id, h.branch_code
                 FROM hearse_bookings hb
                 LEFT JOIN hearses h ON hb.hearse_id = h.id
                 WHERE hb.booking_dates LIKE ?
                 AND hb.status NOT IN ('completed', 'cancelled')`,
                [`%${now.split('T')[0]}%`]
            );

            // Real branch names (Nairobi / Thika / …) come from the branch registry.
            await decorateBranchNames(bookings as any[]);

            if (bookings.length > 0) {
                // Group bookings by tenant so notifications go to the correct tenant room
                const tenantGroups = this.groupBookingsByTenant(bookings);
                for (const [tenantSlug, tenantBookings] of tenantGroups) {
                    const branchGroups = tenantBookings.reduce((acc: Record<string, any[]>, booking: any) => {
                        const branchKey = booking.branch_name || booking.branch_code || 'general';
                        if (!acc[branchKey]) {
                            acc[branchKey] = [];
                        }
                        acc[branchKey].push(booking);
                        return acc;
                    }, {} as Record<string, any[]>);

                    const branchBreakdown = Object.entries(branchGroups).map(([branch, branchBookings]) => ({
                        branchCode: branch,
                        count: (branchBookings as any[]).length,
                        bookings: (branchBookings as any[]).map((b: any) => ({
                            bookingCode: b.booking_code,
                            clientName: b.client_name,
                            destination: b.destination,
                            bookingDates: b.booking_dates
                        }))
                    }));

                    // Skip if this exact weekly summary was already emitted
                    if (!this.shouldEmit('weekly_bookings_summary', tenantSlug, this.bookingSignature(tenantBookings, now.split('T')[0]))) {
                        continue;
                    }

                    const clientSummary = this.describeBookings(tenantBookings);
                    const message = clientSummary
                        ? `You have ${tenantBookings.length} booking(s) in the next 7 days: ${clientSummary}`
                        : `You have ${tenantBookings.length} booking(s) scheduled for the next 7 days`;

                    this.emitNotification('weekly_bookings_summary', {
                        type: 'weekly_summary',
                        title: 'Weekly Bookings Summary',
                        message,
                        totalBookings: tenantBookings.length,
                        bookings: tenantBookings.map((b: any) => ({
                            bookingCode: b.booking_code,
                            clientName: b.client_name,
                            clientPhone: b.client_phone,
                            destination: b.destination,
                            bookingDates: b.booking_dates,
                            hearseName: b.hearse_name || '',
                            plateNumber: b.plate_number || '',
                            branchId: b.branch_id,
                            branchCode: b.branch_code,
                            branchName: b.branch_name || ''
                        })),
                        branchBreakdown,
                        timestamp: getKenyaTimeISO()
                    }, tenantSlug);
                }
            }
        } catch (error) {
            logger.error({ err: error }, 'Error checking weekly hearse bookings');
        }
    }

    /**
     * Group bookings by tenant slug so notifications go to the correct tenant room
     */
    private groupBookingsByTenant(bookings: any[]): Map<string, any[]> {
        const tenantGroups = new Map<string, any[]>();
        for (const booking of bookings) {
            const tenantSlug = booking.tenant_db_name || 'system';
            if (!tenantGroups.has(tenantSlug)) {
                tenantGroups.set(tenantSlug, []);
            }
            tenantGroups.get(tenantSlug)!.push(booking);
        }
        return tenantGroups;
    }

    /**
     * Emit notification via Socket.IO Service
     */
    private emitNotification(eventName: string, data: any, tenantSlug?: string): void {
        try {
            // Emit through socketio service via HTTP POST
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            const targetTenant = tenantSlug || 'system';

            axios.post(`${socketioServiceUrl}/emit/${eventName}`, {
                tenantSlug: targetTenant,
                data: {
                    id: `hearse-cron-${eventName}-${Date.now()}`,
                    ...data,
                    timestamp: getKenyaTimeISO()
                }
            }, { timeout: 30000 }).then(() => {
                logger.info({ eventName, tenantSlug: targetTenant }, 'Emitted hearse notification');
            }).catch((error) => {
                logger.error({ err: error, eventName, tenantSlug: targetTenant }, 'Error emitting hearse notification');
            });
        } catch (error) {
            logger.error({ err: error, eventName }, 'Error emitting hearse notification');
        }
    }
    /**
     * Send immediate notification (can be called from controllers)
     */
    sendImmediateNotification(eventName: string, data: any, tenantSlug?: string): void {
        this.emitNotification(eventName, data, tenantSlug);
    }
}

// Singleton instance
let notificationCronService: NotificationCronService | null = null;

/**
 * Initialize the notification cron service
 */
export function initializeNotificationCron(io: any): NotificationCronService {
    if (!notificationCronService) {
        notificationCronService = new NotificationCronService(io);
        notificationCronService.start();
    }
    return notificationCronService;
}


/**
 * Get the notification cron service instance
 */
export function getNotificationCronService(): NotificationCronService | null {
    return notificationCronService;
}