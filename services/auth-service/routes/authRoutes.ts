/**
 * Auth Routes - TypeScript
 * Defines authentication endpoints with rate limiting and CSRF protection
 */

import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  login,
  register,
  refresh,
  logout,
  createUser,
  listUsers,
  getMe,
  changePassword,
  forgotPassword,
  resetPasswordWithToken,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// ============================================
// RATE LIMITING - Login brute force protection
// ============================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { success: false, message: 'Too many recovery attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// AUTH ROUTES
// ============================================

// Login - rate limited
router.post('/login', authLimiter, login);

// Register - currently returns 501 (use onboarding)
router.post('/register', register);

// Token refresh
router.post('/refresh', refresh);
router.post('/forgot-password', recoveryLimiter, forgotPassword);
router.post('/reset-password', recoveryLimiter, resetPasswordWithToken);

// Get current user from token
router.get('/me', getMe);

// Change password (cross-tenant search)
router.post('/change-password', changePassword);

// ============================================
// PROTECTED ROUTES (require auth)
// ============================================

// Logout
router.post('/logout', protect, logout);

// Create user (admin only)
router.post('/users', protect, createUser);

// List all users (admin only)
router.get('/users', protect, listUsers);

// ============================================
// SESSION STATUS
// ============================================
router.get('/session', (req: Request, res: Response) => {
  const session = req.session as any;
  const isAuthenticated = !!(
    session?.userId &&
    session?.tenantId &&
    req.cookies?.['restpoint.sid']
  );

  if (!isAuthenticated) {
    return res.json({ success: true, authenticated: false });
  }

  res.json({
    success: true,
    authenticated: true,
    session: {
      userId: session.userId,
      tenantId: session.tenantId,
      tenantSlug: session.tenantSlug,
    },
  });
});

// ============================================
// HEALTH
// ============================================
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

export default router;
