import { beforeEach, describe, expect, it } from 'vitest';
import { tokenStorage } from '../token-storage';

describe('tokenStorage', () => {
  beforeEach(() => {
    (globalThis as { __reset_secure_store__?: () => void }).__reset_secure_store__?.();
  });

  it('persists and clears tokens via SecureStore', async () => {
    await tokenStorage.setTokens({ accessToken: 'access', refreshToken: 'refresh' });
    expect(tokenStorage.getAccessToken()).toBe('access');
    expect(tokenStorage.getRefreshToken()).toBe('refresh');
    expect(tokenStorage.hasSessionHint()).toBe(true);

    await tokenStorage.clearTokens();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(tokenStorage.hasSessionHint()).toBe(false);
  });

  it('stores and retrieves the cached session user', async () => {
    await tokenStorage.setCachedUser({
      id: '1',
      email: 'a@b.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      roles: ['Student'],
      permissions: [],
      organizationIds: ['org'],
    });
    const user = await tokenStorage.getCachedUser();
    expect(user?.email).toBe('a@b.com');
    await tokenStorage.clearCachedUser();
    expect(await tokenStorage.getCachedUser()).toBeNull();
  });

  it('tracks biometric preference', async () => {
    expect(await tokenStorage.isBiometricEnabled()).toBe(false);
    await tokenStorage.setBiometricEnabled(true);
    expect(await tokenStorage.isBiometricEnabled()).toBe(true);
  });
});
