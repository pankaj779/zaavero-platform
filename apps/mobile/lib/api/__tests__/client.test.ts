import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../client';
import { tokenStorage } from '../../auth/token-storage';
import { authService } from '../../auth/auth-service';
import { UnauthorizedError, ForbiddenError, NetworkError } from '../errors';

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    (globalThis as { __reset_secure_store__?: () => void }).__reset_secure_store__?.();
    authService._resetRefreshLockForTests();
    vi.spyOn(tokenStorage, 'getAccessToken').mockReturnValue('access-token');
    vi.spyOn(tokenStorage, 'getRefreshToken').mockReturnValue('refresh-token');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('attaches the bearer token and unwraps the success envelope', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, message: 'ok', data: { id: '1' }, timestamp: '' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await apiFetch<{ id: string }>('/courses');
    expect(result).toEqual({ id: '1' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/courses'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const init = firstCall?.[1] as { headers: Headers } | undefined;
    expect(init?.headers.get('Authorization')).toBe('Bearer access-token');
  });

  it('throws ForbiddenError on 403', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, message: 'Nope' }), { status: 403 }),
    ) as unknown as typeof fetch;

    await expect(apiFetch('/admin/users')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NetworkError when fetch fails', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('network');
    }) as unknown as typeof fetch;

    await expect(apiFetch('/courses')).rejects.toBeInstanceOf(NetworkError);
  });

  it('logs out and throws UnauthorizedError when refresh fails after 401', async () => {
    const refreshSpy = vi.spyOn(authService, 'refresh').mockResolvedValue(false);
    const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue(undefined);

    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, message: 'expired' }), { status: 401 }),
    ) as unknown as typeof fetch;

    await expect(apiFetch('/courses')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(refreshSpy).toHaveBeenCalled();
    expect(logoutSpy).toHaveBeenCalled();
  });
});
