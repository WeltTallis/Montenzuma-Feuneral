import { Router } from 'express';
import { SystemAdminController } from '../controllers/systemAdminController';

// @ts-ignore - authMiddleware is CommonJS JavaScript, not TypeScript
const { requireSystemAdmin } = require('../../app-global/middlewares/authMiddleware');

const router = Router();
const controller = new SystemAdminController();

// ─── System Admin Routes ────────────────────────────────────────────
// These routes are for the system administrator to manage all tenants.
//
// SECURITY: this router is mounted with NO other authentication, which meant
// `GET /system-admin/tenants` returned every tenant's db_name/email/phone to an
// anonymous caller and `POST /system-admin/tenants/:id/suspend` could take a
// paying customer's production platform offline. The guard is applied BOTH
// here and at the mount site in server.ts, so the routes can never be
// re-exposed by a future re-mount.
router.use(requireSystemAdmin);

// Dashboard stats
router.get('/dashboard', controller.getDashboardStats.bind(controller));

// Tenant management
router.get('/tenants', controller.getAllTenants.bind(controller));
router.get('/tenants/:tenantId', controller.getTenantDetails.bind(controller));

// Tenant actions
router.post('/tenants/:tenantId/suspend', controller.suspendTenant.bind(controller));
router.post('/tenants/:tenantId/activate', controller.activateTenant.bind(controller));
router.post('/tenants/:tenantId/stop', controller.stopTenant.bind(controller));

// Subscription management
router.put('/tenants/:tenantId/subscription', controller.updateSubscription.bind(controller));

export default router;
