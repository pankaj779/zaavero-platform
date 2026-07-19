import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../auth-service';
import { authApi } from '../auth-api';
import { tokenStorage } from '../token-storage';

describe('authService', () => {
  beforeEach(() => {
    (globalThis as { __reset_secure_store__?: () => void }).__reset_secure_store__?.();
    authService._resetRefreshLockForTests();
    vi.restoreAllMocks();
  });

  it('login stores tokens and returns the merged session user', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: '15m',
      user: { id: 'u1', email: 'a@b.com', firstName: 'Ada', lastName: 'Lovelace' },
    });
    vi.spyOn(authApi, 'me').mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      profileImage: null,
      roles: ['Student'],
      permissions: ['courses.read'],
      organizationIds: ['org-1'],
      emailVerified: true,
      isActive: true,
    });

    const user = await authService.login({ email: 'a@b.com', password: 'secret' });

    expect(user.roles).toEqual(['Student']);
    expect(user.organizationIds).toEqual(['org-1']);
    expect(tokenStorage.getAccessToken()).toBe('a');
    expect(tokenStorage.getRefreshToken()).toBe('r');
  });

  it('refresh is single-flight', async () => {
    vi.spyOn(tokenStorage, 'getRefreshToken').mockReturnValue('refresh');
    const refreshSpy = vi.spyOn(authApi, 'refresh').mockImplementation(
      async () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              accessToken: 'a2',
              refreshToken: 'r2',
              expiresIn: '15m',
            });
          }, 20);
        }),
    );

    const [a, b] = await Promise.all([authService.refresh(), authService.refresh()]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('logout clears tokens even if the network call fails', async () => {
    await tokenStorage.setTokens({ accessToken: 'a', refreshToken: 'r' });
    // authApi.logout swallows network errors; simulate a completed (failed) call.
    vi.spyOn(authApi, 'logout').mockResolvedValue(undefined);

    await authService.logout();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
