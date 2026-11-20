import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { safeQuery } from '../database';

/**
 * Get comprehensive hearse fleet analytics
 */
export const getHearseFleetAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    try {
        const [
            fleetStatus,
            bookingStats,
            hearseUtilization,
            maintenanceStatus,
            revenueData,
            topPerformers,
            bookingTrends,
            statusDistribution,
            vehicleHealth
        ] = await Promise.allSettled([
            safeQuery(`SELECT COALESCE(status, 'unknown') as status, COUNT(*) as count FROM hearses GROUP BY status`),
            safeQuery(`SELECT COUNT(*) as total_bookings, COUNT(CASE WHEN status='booked' THEN 1 END) as active_bookings, COUNT(CASE WHEN status='completed' THEN 1 END) as completed_bookings, COUNT(CASE WHEN status='cancelled' THEN 1 END) as cancelled_bookings, COUNT(CASE WHEN WEEK(booking_date)=WEEK(CURDATE()) AND YEAR(booking_date)=YEAR(CURDATE()) THEN 1 END) as this_week, COUNT(CASE WHEN DATE(booking_date)=CURDATE() THEN 1 END) as today FROM hearse_bookings`),
            safeQuery(`SELECT h.id, h.hearse_name, h.plate_number, h.status, COUNT(hb.id) as total_bookings, SUM(CASE WHEN hb.status='completed' THEN 1 ELSE 0 END) as completed_trips, SUM(CASE WHEN hb.status='cancelled' THEN 1 ELSE 0 END) as cancelled_trips, MAX(hb.booking_date) as last_booking_date FROM hearses h LEFT JOIN hearse_bookings hb ON hb.hearse_id = h.id GROUP BY h.id, h.hearse_name, h.plate_number, h.status ORDER BY total_bookings DESC`),
            safeQuery(`SELECT COUNT(*) as total_hearses, COUNT(CASE WHEN service_due_date IS NOT NULL AND service_due_date <= CURDATE() THEN 1 END) as due_for_service, COUNT(CASE WHEN service_due_date IS NOT NULL AND service_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as due_in_30_days, COUNT(CASE WHEN insurance_expiry IS NOT NULL AND insurance_expiry <= CURDATE() THEN 1 END) as insurance_expired, COUNT(CASE WHEN insurance_expiry IS NOT NULL AND insurance_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as insurance_expires_in_30 FROM hearses`),
            safeQuery(`SELECT COALESCE(SUM(total_charge), 0) as total_revenue, COALESCE(SUM(paid_amount), 0) as collected_revenue, COALESCE(SUM(total_charge) - SUM(paid_amount), 0) as outstanding_revenue, COUNT(*) as total_trips FROM hearse_bookings WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`),
            safeQuery(`SELECT h.id, h.hearse_name, h.plate_number, h.make, h.model, h.year, COUNT(hb.id) as total_bookings, SUM(CASE WHEN hb.status='completed' THEN 1 ELSE 0 END) as completed_trips, COALESCE(SUM(hb.total_charge), 0) as revenue FROM hearses h LEFT JOIN hearse_bookings hb ON hb.hearse_id = h.id AND hb.booking_date >= DATE_SUB(NOW(), INTERVAL 90 DAY) GROUP BY h.id, h.hearse_name, h.plate_number, h.make, h.model, h.year HAVING completed_trips > 0 ORDER BY completed_trips DESC LIMIT 10`),
            safeQuery(`SELECT DATE_FORMAT(booking_date, '%Y-%m') as month, DATE_FORMAT(booking_date, '%b %Y') as month_label, COUNT(*) as total_bookings, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled, COALESCE(SUM(total_charge), 0) as revenue FROM hearse_bookings WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY DATE_FORMAT(booking_date, '%Y-%m'), DATE_FORMAT(booking_date, '%b %Y') ORDER BY DATE_FORMAT(booking_date, '%Y-%m') ASC`),
            safeQuery(`SELECT COALESCE(status, 'unknown') as status, COUNT(*) as count FROM hearse_bookings WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY status`),
            safeQuery(`SELECT COUNT(*) as total_vehicles, COUNT(CASE WHEN status='available' THEN 1 END) as available, COUNT(CASE WHEN status='booked' THEN 1 END) as booked, COUNT(CASE WHEN status='maintenance' THEN 1 END) as in_maintenance, COUNT(CASE WHEN status='unavailable' THEN 1 END) as unavailable, ROUND(COUNT(CASE WHEN status='available' THEN 1 END) * 100.0 / COUNT(*), 2) as availability_rate FROM hearses`)
        ]);

        const extractValue = (result: any, idx = 0) => {
            if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
                return result.value[idx] || result.value[0] || null;
            }
            return null;
        };

        const extractArray = (result: any) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                return result.value || [];
            }
            return [];
        };

        const data = {
            fleetStatus: extractArray(fleetStatus).map((r: any) => ({ status: r.status, count: r.count })),
            bookings: extractValue(bookingStats) ? {
                total: extractValue(bookingStats).total_bookings || 0,
                active: extractValue(bookingStats).active_bookings || 0,
                completed: extractValue(bookingStats).completed_bookings || 0,
                cancelled: extractValue(bookingStats).cancelled_bookings || 0,
                thisWeek: extractValue(bookingStats).this_week || 0,
                today: extractValue(bookingStats).today || 0
            } : { total: 0, active: 0, completed: 0, cancelled: 0, thisWeek: 0, today: 0 },
            utilization: extractArray(hearseUtilization).map((h: any) => ({
                id: h.id, name: h.hearse_name, plate: h.plate_number, status: h.status,
                totalBookings: h.total_bookings, completedTrips: h.completed_trips,
                cancelledTrips: h.cancelled_trips, lastBooking: h.last_booking_date
            })),
            maintenance: extractValue(maintenanceStatus) ? {
                totalHearses: extractValue(maintenanceStatus).total_hearses || 0,
                dueForService: extractValue(maintenanceStatus).due_for_service || 0,
                dueIn30Days: extractValue(maintenanceStatus).due_in_30_days || 0,
                insuranceExpired: extractValue(maintenanceStatus).insurance_expired || 0,
                insuranceExpiresIn30: extractValue(maintenanceStatus).insurance_expires_in_30 || 0
            } : { totalHearses: 0, dueForService: 0, dueIn30Days: 0, insuranceExpired: 0, insuranceExpiresIn30: 0 },
            revenue30d: extractValue(revenueData) ? {
                total: parseFloat(extractValue(revenueData).total_revenue || 0).toFixed(2),
                collected: parseFloat(extractValue(revenueData).collected_revenue || 0).toFixed(2),
                outstanding: parseFloat(extractValue(revenueData).outstanding_revenue || 0).toFixed(2),
                trips: extractValue(revenueData).total_trips || 0
            } : { total: '0.00', collected: '0.00', outstanding: '0.00', trips: 0 },
            topPerformers: extractArray(topPerformers).map((h: any) => ({
                id: h.id, name: h.hearse_name, plate: h.plate_number,
                vehicle: `${h.make} ${h.model} (${h.year})`,
                totalBookings: h.total_bookings, completedTrips: h.completed_trips,
                revenue: parseFloat(h.revenue || 0).toFixed(2)
            })),
            trends: extractArray(bookingTrends).map((t: any) => ({
                month: t.month, monthLabel: t.month_label, totalBookings: t.total_bookings,
                completed: t.completed, cancelled: t.cancelled,
                revenue: parseFloat(t.revenue || 0).toFixed(2)
            })),
            statusDistribution: extractArray(statusDistribution).map((s: any) => ({ status: s.status, count: s.count })),
            fleetHealth: extractValue(vehicleHealth) ? {
                totalVehicles: extractValue(vehicleHealth).total_vehicles || 0,
                available: extractValue(vehicleHealth).available || 0,
                booked: extractValue(vehicleHealth).booked || 0,
                inMaintenance: extractValue(vehicleHealth).in_maintenance || 0,
                unavailable: extractValue(vehicleHealth).unavailable || 0,
                availabilityRate: extractValue(vehicleHealth).availability_rate || 0
            } : { totalVehicles: 0, available: 0, booked: 0, inMaintenance: 0, unavailable: 0, availabilityRate: 0 },
            metadata: { executionTime: Date.now() - startTime, timestamp: new Date().toISOString(), source: 'hearse-service-independent-db' }
        };

        res.json({ success: true, data, metadata: { requestId, timestamp: new Date().toISOString(), executionTime: Date.now() - startTime } });
    } catch (error) {
        res.status(200).json({
            success: true,
            data: {
                fleetStatus: [], bookings: { total: 0, active: 0, completed: 0, cancelled: 0, thisWeek: 0, today: 0 },
                utilization: [], maintenance: { totalHearses: 0, dueForService: 0, dueIn30Days: 0, insuranceExpired: 0, insuranceExpiresIn30: 0 },
                revenue30d: { total: '0.00', collected: '0.00', outstanding: '0.00', trips: 0 },
                topPerformers: [], trends: [], statusDistribution: [],
                fleetHealth: { totalVehicles: 0, available: 0, booked: 0, inMaintenance: 0, unavailable: 0, availabilityRate: 0 }
            },
            metadata: { requestId, timestamp: new Date().toISOString(), error: (error as Error).message }
        });
    }
});

/**
 * Get hearse analytics for a specific time period
 */
export const getHearsePeriodAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { period = '30' } = req.query;
    const days = parseInt(period as string) || 30;

    try {
        const data = await safeQuery(`
            SELECT DATE_FORMAT(booking_date, '%Y-%m-%d') as date, COUNT(*) as total_bookings,
            SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled,
            COALESCE(SUM(total_charge), 0) as revenue, COALESCE(AVG(total_charge), 0) as avg_charge
            FROM hearse_bookings WHERE booking_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE_FORMAT(booking_date, '%Y-%m-%d')
            ORDER BY DATE_FORMAT(booking_date, '%Y-%m-%d') DESC
        `, [days]);

        res.json({
            success: true,
            data: data.map((d: any) => ({
                date: d.date, totalBookings: d.total_bookings, completed: d.completed,
                cancelled: d.cancelled, revenue: parseFloat(d.revenue || 0).toFixed(2),
                avgCharge: parseFloat(d.avg_charge || 0).toFixed(2)
            }))
        });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});