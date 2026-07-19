import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import type { UserRole } from '@graphology/types';
import { useAuth } from '../lib/auth/auth-context';
import { registerForPushNotifications } from '../lib/notifications/push';
import { LoadingState, Screen } from './ui';

/**
 * Guards a role portal. Enforces authentication and role membership on the
 * client (the backend RBAC remains the source of truth for every request), and
 * registers the device for push notifications once a session is active.
 */
export function RoleGuard({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}): React.JSX.Element {
  const { loading, isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      void registerForPushNotifications();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasRole(role)) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}
