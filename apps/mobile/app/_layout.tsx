import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { asyncStoragePersister, queryClient } from '../lib/query/client';
import { configureOnlineManager } from '../lib/offline/online-manager';
import { AuthProvider } from '../lib/auth/auth-context';

export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    configureOnlineManager();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: asyncStoragePersister,
            maxAge: 24 * 60 * 60 * 1000,
            dehydrateOptions: {
              // Never persist AI streams or auth-sensitive mutations.
              shouldDehydrateQuery: (query) => query.state.status === 'success',
            },
          }}
          onSuccess={() => {
            void queryClient.resumePausedMutations();
          }}
        >
          <AuthProvider>
            <StatusBar style="auto" />
            <Slot />
          </AuthProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
