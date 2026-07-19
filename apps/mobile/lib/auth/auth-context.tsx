import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { UserRole } from '@graphology/types';
import { authService } from './auth-service';
import { biometric } from './biometric';
import { tokenStorage } from './token-storage';
import type { AuthSessionUser, LoginCredentials, RegisterInput } from '../api/types';

export type PortalRole = 'Admin' | 'Teacher' | 'Student';

interface AuthContextValue {
  user: AuthSessionUser | null;
  roles: UserRole[];
  permissions: string[];
  organizationIds: string[];
  primaryOrganizationId: string | null;
  activeRole: PortalRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSessionUser>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loginWithBiometrics: () => Promise<AuthSessionUser | null>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_PRIORITY: PortalRole[] = ['Admin', 'Teacher', 'Student'];

function resolveActiveRole(roles: UserRole[]): PortalRole | null {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

  const bootstrap = useCallback(async () => {
    try {
      const restored = await authService.loadSession();
      setUser(restored);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextUser = await authService.login(credentials);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    await authService.register(input);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const restored = await authService.loadSession();
    setUser(restored);
  }, []);

  const loginWithBiometrics = useCallback(async () => {
    if (!(await biometric.isEnabled())) return null;
    if (!tokenStorage.hasSessionHint()) return null;
    const ok = await biometric.authenticate('Unlock Graphology');
    if (!ok) return null;
    const restored = await authService.loadSession();
    setUser(restored);
    return restored;
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roles = user?.roles ?? [];
    const permissions = user?.permissions ?? [];
    const organizationIds = user?.organizationIds ?? [];
    return {
      user,
      roles,
      permissions,
      organizationIds,
      primaryOrganizationId: organizationIds[0] ?? null,
      activeRole: resolveActiveRole(roles),
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      logout,
      refreshSession,
      loginWithBiometrics,
      hasPermission: (permission: string) => permissions.includes(permission),
      hasRole: (role: UserRole) => roles.includes(role),
    };
  }, [user, loading, login, register, logout, refreshSession, loginWithBiometrics]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return ctx;
}
