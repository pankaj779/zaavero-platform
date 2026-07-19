import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth/auth-context';
import { LoadingState, Screen } from '../components/ui';

/**
 * Entry route: restores the session then redirects to the correct role portal.
 */
export default function Index(): React.JSX.Element {
  const { loading, isAuthenticated, activeRole } = useAuth();

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Restoring your session…" />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (activeRole === 'Admin') return <Redirect href="/(admin)/dashboard" />;
  if (activeRole === 'Teacher') return <Redirect href="/(teacher)/dashboard" />;
  if (activeRole === 'Student') return <Redirect href="/(student)/dashboard" />;

  // Authenticated but no supported portal role.
  return <Redirect href="/(auth)/no-access" />;
}
