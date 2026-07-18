'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '../constants/routes';
import { useAuthContext } from './auth-provider';
import { hasAllPermissions, hasAnyRole } from './auth-session';
import type { AuthContextValue, AuthRole } from './auth-types';

export function useAuth(): AuthContextValue {
  return useAuthContext();
}

export function usePermissions(): {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAll: (required: readonly string[]) => boolean;
} {
  const { permissions } = useAuthContext();
  return {
    permissions,
    hasPermission: (permission: string) => permissions.includes(permission),
    hasAll: (required: readonly string[]) => hasAllPermissions(permissions, required),
  };
}

export function useOrganization(): {
  organizationIds: string[];
  primaryOrganizationId: string | null;
  belongsTo: (organizationId: string) => boolean;
} {
  const { organizationIds } = useAuthContext();
  return {
    organizationIds,
    primaryOrganizationId: organizationIds[0] ?? null,
    belongsTo: (organizationId: string) => organizationIds.includes(organizationId),
  };
}

/**
 * Ensures the user is authenticated; redirects to login otherwise.
 */
export function useRequireAuth(redirectTo: string = ROUTES.login): AuthContextValue {
  const auth = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`${redirectTo}${next}`);
    }
  }, [auth.loading, auth.isAuthenticated, redirectTo, router, pathname]);

  return auth;
}

export function useRequireRole(
  roles: readonly AuthRole[],
  options?: { fallbackPath?: string },
): AuthContextValue {
  const auth = useRequireAuth();
  const router = useRouter();
  const fallback = options?.fallbackPath ?? ROUTES.login;

  useEffect(() => {
    if (auth.loading || !auth.isAuthenticated) {
      return;
    }

    if (!hasAnyRole(auth.roles, roles)) {
      router.replace(fallback);
    }
  }, [auth.loading, auth.isAuthenticated, auth.roles, roles, router, fallback]);

  return auth;
}
