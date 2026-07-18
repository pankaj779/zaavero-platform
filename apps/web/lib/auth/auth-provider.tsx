'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from './auth-service';
import type { AuthContextValue, AuthSessionUser, LoginCredentials } from './auth-types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const active = { current: true };

    void (async () => {
      try {
        const session = await authService.loadSession();
        if (active.current) {
          setUser(session);
        }
      } catch {
        if (active.current) {
          setUser(null);
        }
      } finally {
        if (active.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active.current = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextUser = await authService.login(credentials);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const ok = await authService.refresh();
    if (!ok) {
      setUser(null);
      return false;
    }

    try {
      const session = await authService.loadSession();
      setUser(session);
      return Boolean(session);
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      organizationIds: user?.organizationIds ?? [],
      roles: user?.roles ?? [],
      permissions: user?.permissions ?? [],
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
