import { vi } from 'vitest';

const store = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    store.delete(key);
  }),
}));

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(async () => true),
  isEnrolledAsync: vi.fn(async () => true),
  authenticateAsync: vi.fn(async () => ({ success: true })),
  supportedAuthenticationTypesAsync: vi.fn(async () => [1, 2]),
}));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiUrl: 'http://localhost:3001/api/v1' } } },
}));

vi.mock('expo/fetch', () => ({
  fetch: vi.fn(),
}));

(globalThis as { __reset_secure_store__?: () => void }).__reset_secure_store__ = () => {
  store.clear();
};
