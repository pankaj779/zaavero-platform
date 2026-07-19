import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth/auth-context';
import { LoadingState, Screen } from '../../components/ui';

export default function AuthLayout(): React.JSX.Element {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
