'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ROUTES } from '../constants/routes';
import { useAuth } from './auth-hooks';
import {
  canAccessAdminArea,
  canAccessStudentPortal,
  canAccessTeacherPortal,
  hasAllPermissions,
  hasAnyRole,
  resolvePostLoginPath,
} from './auth-session';
import type { AuthRole } from './auth-types';

function GuardSpinner(): React.JSX.Element {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground"
      role="status"
    >
      Checking session…
    </div>
  );
}

export function RequireAuth({
  children,
  redirectTo = ROUTES.login,
}: {
  children: ReactNode;
  redirectTo?: string;
}): React.JSX.Element | null {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [loading, isAuthenticated, redirectTo, router]);

  if (loading) {
    return <GuardSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function RequireRole({
  roles,
  children,
  fallbackPath,
}: {
  roles: readonly AuthRole[];
  children: ReactNode;
  fallbackPath?: string;
}): React.JSX.Element | null {
  const auth = useAuth();
  const router = useRouter();
  const fallback = fallbackPath ?? resolvePostLoginPath(auth.roles);

  useEffect(() => {
    if (auth.loading || !auth.isAuthenticated) {
      return;
    }

    if (!hasAnyRole(auth.roles, roles)) {
      router.replace(fallback);
    }
  }, [auth.loading, auth.isAuthenticated, auth.roles, roles, router, fallback]);

  if (auth.loading) {
    return <GuardSpinner />;
  }

  if (!auth.isAuthenticated || !hasAnyRole(auth.roles, roles)) {
    return null;
  }

  return <>{children}</>;
}

export function RequirePermission({
  permissions,
  children,
  fallbackPath = ROUTES.login,
}: {
  permissions: readonly string[];
  children: ReactNode;
  fallbackPath?: string;
}): React.JSX.Element | null {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading || !auth.isAuthenticated) {
      return;
    }

    if (!hasAllPermissions(auth.permissions, permissions)) {
      router.replace(fallbackPath);
    }
  }, [auth.loading, auth.isAuthenticated, auth.permissions, permissions, router, fallbackPath]);

  if (auth.loading) {
    return <GuardSpinner />;
  }

  if (!auth.isAuthenticated || !hasAllPermissions(auth.permissions, permissions)) {
    return null;
  }

  return <>{children}</>;
}

export function RequireOrganization({
  organizationId,
  children,
  fallbackPath = ROUTES.login,
}: {
  organizationId: string;
  children: ReactNode;
  fallbackPath?: string;
}): React.JSX.Element | null {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading || !auth.isAuthenticated) {
      return;
    }

    if (!auth.organizationIds.includes(organizationId)) {
      router.replace(fallbackPath);
    }
  }, [
    auth.loading,
    auth.isAuthenticated,
    auth.organizationIds,
    organizationId,
    router,
    fallbackPath,
  ]);

  if (auth.loading) {
    return <GuardSpinner />;
  }

  if (!auth.isAuthenticated || !auth.organizationIds.includes(organizationId)) {
    return null;
  }

  return <>{children}</>;
}

/** Portal-specific convenience guards */
export function RequireStudentPortal({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element | null {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading) {
      return;
    }
    if (!auth.isAuthenticated) {
      router.replace(ROUTES.login);
      return;
    }
    if (!canAccessStudentPortal(auth.roles)) {
      router.replace(resolvePostLoginPath(auth.roles));
    }
  }, [auth, router]);

  if (auth.loading || !auth.isAuthenticated || !canAccessStudentPortal(auth.roles)) {
    return auth.loading ? <GuardSpinner /> : null;
  }

  return <>{children}</>;
}

export function RequireTeacherPortal({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element | null {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading) {
      return;
    }
    if (!auth.isAuthenticated) {
      router.replace(ROUTES.login);
      return;
    }
    if (!canAccessTeacherPortal(auth.roles)) {
      router.replace(resolvePostLoginPath(auth.roles));
    }
  }, [auth, router]);

  if (auth.loading || !auth.isAuthenticated || !canAccessTeacherPortal(auth.roles)) {
    return auth.loading ? <GuardSpinner /> : null;
  }

  return <>{children}</>;
}

export function RequireAdminArea({ children }: { children: ReactNode }): React.JSX.Element | null {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading) {
      return;
    }
    if (!auth.isAuthenticated) {
      router.replace(ROUTES.login);
      return;
    }
    if (!canAccessAdminArea(auth.roles)) {
      router.replace(resolvePostLoginPath(auth.roles));
    }
  }, [auth, router]);

  if (auth.loading || !auth.isAuthenticated || !canAccessAdminArea(auth.roles)) {
    return auth.loading ? <GuardSpinner /> : null;
  }

  return <>{children}</>;
}
