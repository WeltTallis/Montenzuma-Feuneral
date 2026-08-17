import cron from 'node-cron';
import axios from 'axios';
import { safeQuery } from '../database';
import { getKenyaTimeISO } from '@montezuma/shared-utils';

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

    constructor(io: any) {
        this.io = io;
    }

    /**
     * Start all cron jobs
     */
    start(): void {
        if (this.isRunning) {
            console.log('  Notification cron service already running');
            return;
        }

        console.log(' Starting notification cron service...');

        // Run every 4 seconds to check for upcoming bookings
        cron.schedule('*/30 * * * * *', () => {
            this.checkUpcomingBookings();
        });

        // Run every hour to check for upcoming bookings in the next 24 hours
        cron.schedule('0 * * * *', () => {
            this.checkUpcomingBookings();
        });

        // Run every 30 minutes to check for bookings in the next 2 hours (urgent)
        cron.schedule('*/3 * * * *', () => {
            this.checkUrgentBookings();
        });

        // Run daily at 8 AM to check for bookings in the next 7 days
        cron.schedule('0 8 * * *', () => {
            this.checkWeeklyBookings();
        });

        this.isRunning = true;
        console.log('✅ Notification cron service started');
    }

    /**
     * Stop all cron jobs
     */
    stop(): void {
        this.isRunning = false;
        console.log('🛑 Notification cron service stopped');
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
                        h.hearse_name, h.plate_number, h.branch_id, h.branch_code
                 FROM hearse_bookings hb
                 LEFT JOIN hearses h ON hb.hearse_id = h.id
                 WHERE hb.booking_dates LIKE ?
                 AND hb.status NOT IN ('completed', 'cancelled')`,
                [`%"${tomorrowStr}"%`]
            );

            if (bookings.length > 0) {
                // Group bookings by tenant so notifications go to the correct tenant room
                const tenantGroups = this.groupBookingsByTenant(bookings);
                for (const [tenantSlug, tenantBookings] of tenantGroups) {
                    this.emitNotification('upcoming_bookings_24h', {
                        type: 'reminder',
                        title: 'Upcoming Bookings Tomorrow',
                        message: `You have ${tenantBookings.length} booking(s) scheduled for tomorrow`,
                        bookings: tenantBookings.map(b => ({
                            bookingCode: b.booking_code,
                            clientName: b.client_name,
                            clientPhone: b.client_phone,
                            destination: b.destination,
                            bookingDates: b.booking_dates,
                            hearseName: b.hearse_name || 'N/A',
                            plateNumber: b.plate_number || 'N/A',
                            branchId: b.branch_id,
                            branchCode: b.branch_code
                        })),
                        timestamp: now
                    }, tenantSlug);
                }
            }
        } catch (error) {
            console.error('Error checking upcoming bookings:', error);
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
                        h.hearse_name, h.plate_number, h.branch_id, h.branch_code
                 FROM hearse_bookings hb
                 LEFT JOIN hearses h ON hb.hearse_id = h.id
                 WHERE hb.booking_dates LIKE ?
                 AND hb.status IN ('booked', 'pending')`,
                [`%${now.split('T')[0]}%`]
            );

            if (bookings.length > 0) {
                // Group bookings by tenant so notifications go to the correct tenant room
                const tenantGroups = this.groupBookingsByTenant(bookings);
                for (const [tenantSlug, tenantBookings] of tenantGroups) {
                    this.emitNotification('urgent_bookings_2h', {
                        type: 'urgent_reminder',
                        title: '⚠️ Urgent: Bookings in Next 2 Hours',
                        message: `${tenantBookings.length} booking(s) starting soon!`,
                        bookings: tenantBookings.map(b => ({
                            bookingCode: b.booking_code,
                            clientName: b.client_name,
                            clientPhone: b.client_phone,
                            destination: b.destination,
                            bookingDates: b.booking_dates,
                            hearseName: b.hearse_name || 'N/A',
                            plateNumber: b.plate_number || 'N/A',
                            branchId: b.branch_id,
                            branchCode: b.branch_code
                        })),
                        timestamp: getKenyaTimeISO()
                    }, tenantSlug);
                }
            }
        } catch (error) {
            console.error('Error checking urgent bookings:', error);
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
                        h.hearse_name, h.plate_number, h.branch_id, h.branch_code
                 FROM hearse_bookings hb
                 LEFT JOIN hearses h ON hb.hearse_id = h.id
                 WHERE hb.booking_dates LIKE ?
                 AND hb.status NOT IN ('completed', 'cancelled')`,
                [`%${now.split('T')[0]}%`]
            );

            if (bookings.length > 0) {
                // Group bookings by tenant so notifications go to the correct tenant room
                const tenantGroups = this.groupBookingsByTenant(bookings);
                for (const [tenantSlug, tenantBookings] of tenantGroups) {
                    // Group by branch
                    const branchGroups = tenantBookings.reduce((acc: Record<string, any[]>, booking: any) => {
                        const branchKey = booking.branch_code || 'general';
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

                    this.emitNotification('weekly_bookings_summary', {
                        type: 'weekly_summary',
                        title: '📋 Weekly Bookings Summary',
                        message: `You have ${tenantBookings.length} booking(s) scheduled for the next 7 days`,
                        totalBookings: tenantBookings.length,
                        branchBreakdown,
                        timestamp: getKenyaTimeISO()
                    }, tenantSlug);
                }
            }
        } catch (error) {
            console.error('Error checking weekly bookings:', error);
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
                console.log(`📤 Emitted notification: ${eventName} to tenant_${targetTenant}`);
            }).catch((error) => {
                console.error(`Error emitting notification ${eventName} to tenant_${targetTenant}:`, error.message);
            });
        } catch (error) {
            console.error(`Error emitting notification ${eventName}:`, error);
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