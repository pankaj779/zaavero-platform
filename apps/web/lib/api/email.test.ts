import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));
vi.mock('../auth/api-client', () => ({ apiFetch: apiFetchMock }));

import { EmailApi } from './email';

describe('EmailApi', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('gets and updates organization-scoped preferences', async () => {
    apiFetchMock.mockResolvedValue({
      marketing: false,
      announcements: true,
      digestMode: 'DAILY',
    });

    await expect(EmailApi.getPreferences('org 1')).resolves.toMatchObject({
      security: true,
      announcements: true,
      digestMode: 'DAILY',
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/email/preferences?organizationId=org+1');

    const input = { organizationId: 'org-1', marketing: true, digestMode: 'WEEKLY' as const };
    await EmailApi.updatePreferences(input);
    expect(apiFetchMock).toHaveBeenCalledWith('/email/preferences', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  });

  it('maps paginated admin resources and mutations', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [{ id: 'log-1', to: ['pa***@example.com'], status: 'DELIVERED' }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    const logs = await EmailApi.getLogs({
      organizationId: 'org-1',
      search: ' welcome ',
      status: 'DELIVERED',
      page: 1,
      limit: 20,
    });
    expect(logs.items[0]).toMatchObject({ id: 'log-1', status: 'DELIVERED' });
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/email/admin/logs?organizationId=org-1&search=welcome&status=DELIVERED&page=1&limit=20',
    );

    apiFetchMock.mockResolvedValueOnce({ updated: true });
    await expect(EmailApi.retryQueued('queue/1', 'org-1')).resolves.toBe(true);
    expect(apiFetchMock).toHaveBeenCalledWith('/email/admin/queue/queue%2F1/retry', {
      method: 'POST',
      body: JSON.stringify({ organizationId: 'org-1' }),
    });
  });

  it('uses the existing public resend-verification endpoint', async () => {
    apiFetchMock.mockResolvedValue(null);
    await EmailApi.resendVerification(' User@Example.com ');
    expect(apiFetchMock).toHaveBeenCalledWith('/auth/resend-verification', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email: 'user@example.com' }),
    });
  });

  it('creates, resends, revokes, and accepts invitations', async () => {
    const invitation = {
      id: 'inv-1',
      organizationId: 'org-1',
      invitedById: 'user-1',
      acceptedById: null,
      email: 'new@example.com',
      role: 'Student',
      type: 'STUDENT',
      status: 'PENDING',
      expiresAt: '2026-07-26T00:00:00.000Z',
      acceptedAt: null,
      revokedAt: null,
      createdAt: '2026-07-19T00:00:00.000Z',
      updatedAt: '2026-07-19T00:00:00.000Z',
    };
    apiFetchMock.mockResolvedValueOnce([invitation]);
    await expect(EmailApi.getInvitations('org-1')).resolves.toMatchObject([
      { id: 'inv-1', status: 'PENDING' },
    ]);
    expect(apiFetchMock).toHaveBeenCalledWith('/email/invitations?organizationId=org-1');

    apiFetchMock.mockResolvedValueOnce(invitation);
    await expect(
      EmailApi.createInvitation({
        organizationId: 'org-1',
        email: ' New@Example.com ',
        type: 'STUDENT',
        role: 'Student',
      }),
    ).resolves.toMatchObject({ id: 'inv-1', email: 'new@example.com', status: 'PENDING' });
    expect(apiFetchMock).toHaveBeenCalledWith('/email/invitations', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        email: 'new@example.com',
        type: 'STUDENT',
        role: 'Student',
      }),
    });

    apiFetchMock.mockResolvedValueOnce({ ...invitation, status: 'PENDING' });
    await EmailApi.resendInvitation('inv/1', 'org-1');
    expect(apiFetchMock).toHaveBeenCalledWith('/email/invitations/inv%2F1/resend', {
      method: 'POST',
      body: JSON.stringify({ organizationId: 'org-1' }),
    });

    apiFetchMock.mockResolvedValueOnce({ ...invitation, status: 'REVOKED' });
    await expect(EmailApi.revokeInvitation('inv-1', 'org-1')).resolves.toMatchObject({
      status: 'REVOKED',
    });

    apiFetchMock.mockResolvedValueOnce({ invitationId: 'inv-1', userId: 'user-9' });
    await expect(
      EmailApi.acceptInvitation({
        token: 'a'.repeat(32),
        firstName: 'Ada',
        lastName: 'Lovelace',
        password: 'password1',
      }),
    ).resolves.toEqual({ invitationId: 'inv-1', userId: 'user-9' });
    expect(apiFetchMock).toHaveBeenCalledWith('/email/invitations/accept', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        token: 'a'.repeat(32),
        firstName: 'Ada',
        lastName: 'Lovelace',
        password: 'password1',
      }),
    });
  });
});
