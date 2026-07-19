import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Persister } from '@tanstack/react-query-persist-client';

/**
 * Shared React Query client. Offline support is provided by:
 *  - a long gcTime so cached data survives app restarts once rehydrated
 *  - AsyncStorage persistence of the query cache (non-secret data only)
 *  - paused mutations that resume automatically when connectivity returns
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const asyncStoragePersister: Persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'graphology-query-cache',
  throttleTime: 1000,
});
