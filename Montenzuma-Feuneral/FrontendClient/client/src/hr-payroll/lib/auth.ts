import { decodeTokenClaims, getAuthToken, hasSession } from '../../utils/globalAuth.js';

export type AppRole = 'admin' | 'partner' | 'employee' | 'adv_partner' | 'accountant';

interface TokenPayload {
  exp: number;
  username: string;
  role: AppRole;
}

const mapRestPointRole = (role: unknown): AppRole | null => {
  switch (String(role || '').toLowerCase()) {
    case 'admin':
    case 'tenant_admin':
      return 'admin';
    case 'manager':
      return 'partner';
    case 'accountant':
      return 'accountant';
    case 'staff':
      return 'employee';
    default:
      return null;
  }
};

class AuthManager {
  private static instance: AuthManager;

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) AuthManager.instance = new AuthManager();
    return AuthManager.instance;
  }

  getToken(): string | null {
    const token = getAuthToken();
    return token || null;
  }

  setToken(): never {
    throw new Error('Payroll token storage is disabled; use the RestPoint session.');
  }

  removeToken(): void {
    // Payroll must never clear or replace the shared RestPoint session.
  }

  isTokenValid(): boolean {
    return hasSession();
  }

  getTokenPayload(): TokenPayload | null {
    const claims = decodeTokenClaims();
    const role = this.getUserRole();
    if (!claims || !role) return null;
    return {
      exp: Number(claims.exp) || 0,
      username: String(claims.username || claims.email || ''),
      role,
    };
  }

  getUserRole(): AppRole | null {
    let storedRole: unknown;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      storedRole = user.role;
    } catch {
      storedRole = null;
    }
    return mapRestPointRole(storedRole || decodeTokenClaims()?.role);
  }

  getUserId(): null {
    return null;
  }

  getTokenExpiry(): Date | null {
    const expiresAt = this.getTokenPayload()?.exp;
    return expiresAt ? new Date(expiresAt * 1000) : null;
  }

  startSessionMonitoring(): void {
    // RestPoint owns session expiry and logout behavior.
  }

  hasRole(requiredRole: AppRole): boolean {
    return this.getUserRole() === requiredRole;
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const role = this.getUserRole();
    return role !== null && roles.includes(role);
  }
}

export const authManager = AuthManager.getInstance();

class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000;

  canAttempt(identifier: string): { allowed: boolean; remainingAttempts: number; resetTime?: Date } {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true, remainingAttempts: this.maxAttempts - 1 };
    }
    if (record.count >= this.maxAttempts) {
      return { allowed: false, remainingAttempts: 0, resetTime: new Date(record.resetTime) };
    }
    record.count++;
    return { allowed: true, remainingAttempts: this.maxAttempts - record.count };
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();
