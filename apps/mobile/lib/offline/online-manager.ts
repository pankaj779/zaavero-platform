import { onlineManager } from '@tanstack/react-query';

/**
 * Bridges connectivity state into React Query so paused mutations resume and
 * queries refetch when the device comes back online.
 *
 * We avoid a hard dependency on @react-native-community/netinfo by using the
 * fetch-based reachability signal; if NetInfo is added later this is the single
 * place to wire it. React Query defaults to "online" which is the safe baseline.
 */
export function configureOnlineManager(): void {
  // React Native's global fetch does not emit online/offline events, so we mark
  // the app online by default and let request failures drive retries/backoff.
  onlineManager.setOnline(true);
}

export function setAppOnline(isOnline: boolean): void {
  onlineManager.setOnline(isOnline);
}
