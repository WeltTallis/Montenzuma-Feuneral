import React, { createContext, useContext, useMemo } from 'react';
import { useAuth as useRestPointAuth } from '../../utils/context/AuthContext.jsx';
import { hasSession } from '../../utils/globalAuth.js';
import type { AppRole } from '@hr/lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: AppRole;
  status?: 'active' | 'inactive';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { user: restPointUser, loading, logout: restPointLogout } = useRestPointAuth();
  const rawRole = String(restPointUser?.role || '').toLowerCase();
  const role = mapRestPointRole(rawRole);
  const isAuthenticated = Boolean(restPointUser && role && hasSession());
  const user = useMemo<User | null>(() => {
    if (!isAuthenticated || !restPointUser || !role) return null;
    return {
      // Payroll identity IDs are assigned by its backend after integration.
      // Never infer or synthesize a numeric payroll ID in the browser.
      id: '',
      email: restPointUser.email || '',
      name: restPointUser.fullName || restPointUser.full_name || restPointUser.name || restPointUser.username || '',
      username: restPointUser.username || restPointUser.email || '',
      role,
      status: 'active',
    };
  }, [isAuthenticated, restPointUser, role]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading: loading,
    login: () => {
      throw new Error('Payroll sign-in is disabled; use the RestPoint sign-in flow.');
    },
    logout: () => { void restPointLogout(); },
    updateUser: () => undefined,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const mapRestPointRole = (role: string | null | undefined): AppRole | null => {
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

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
