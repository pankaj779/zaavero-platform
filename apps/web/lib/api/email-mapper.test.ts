import { describe, expect, it } from 'vitest';
import {
  mapAcceptInvitationResult,
  mapEmailPreferences,
  mapEmailProviderStatus,
  mapEmailQueue,
  mapEmailStats,
  mapInvitation,
} from './email-mapper';

describe('email mappers', () => {
  it('normalizes preferences with safe backend defaults', () => {
    expect(mapEmailPreferences({ marketing: true, digestMode: 'invalid' })).toEqual({
      security: true,
      marketing: true,
      announcements: true,
      assignments: true,
      courses: true,
      payments: true,
      certificates: true,
      liveClasses: true,
      system: true,
      digestMode: 'IMMEDIATE',
    });
  });

  it('normalizes queue, provider, and statistics payloads', () => {
    expect(mapEmailQueue({ id: 'q-1', to: ['a***@example.com'], attempts: 2 })).toMatchObject({
      id: 'q-1',
      to: ['a***@example.com'],
      attempts: 2,
    });
    expect(mapEmailProviderStatus({ provider: 'RESEND', configured: true })).toMatchObject({
      provider: 'RESEND',
      configured: true,
    });
    expect(mapEmailStats({ total: 12, delivered: 10, failed: 2 })).toMatchObject({
      total: 12,
      delivered: 10,
      failed: 2,
    });
  });

  it('maps invitation records without exposing token hashes', () => {
    expect(
      mapInvitation({
        id: 'inv-1',
        organizationId: 'org-1',
        email: 'ada@example.com',
        role: 'Teacher',
        type: 'TEACHER',
        status: 'PENDING',
        expiresAt: '2026-07-26T00:00:00.000Z',
        createdAt: '2026-07-19T00:00:00.000Z',
        updatedAt: '2026-07-19T00:00:00.000Z',
        tokenHash: 'secret',
      }),
    ).toMatchObject({
      id: 'inv-1',
      type: 'TEACHER',
      status: 'PENDING',
      email: 'ada@example.com',
    });
    expect(mapAcceptInvitationResult({ invitationId: 'inv-1', userId: 'u-1' })).toEqual({
      invitationId: 'inv-1',
      userId: 'u-1',
    });
  });
});
