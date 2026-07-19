import { describe, expect, it } from 'vitest';
import { SandboxMeetingProvider } from '../providers/sandbox-meeting.provider';

describe('SandboxMeetingProvider', () => {
  const provider = new SandboxMeetingProvider();

  it('is always configured', () => {
    expect(provider.isConfigured()).toBe(true);
  });

  it('creates a sandbox meeting with join and host URLs', async () => {
    const result = await provider.createMeeting(
      { accessToken: 'sandbox' },
      {
        organizationId: 'org-1',
        liveSessionId: '11111111-1111-1111-1111-111111111111',
        title: 'Algebra live',
        startsAt: new Date('2026-07-20T10:00:00.000Z'),
        endsAt: new Date('2026-07-20T11:00:00.000Z'),
        timezone: 'Asia/Kolkata',
      },
    );
    expect(result.provider).toBe('SANDBOX');
    expect(result.joinUrl).toContain('sandbox.meetings.local/j/');
    expect(result.hostUrl).toContain('role=host');
    expect(result.passcode).toHaveLength(8);
  });

  it('parses participant webhook events', () => {
    const event = provider.verifyAndParseWebhook({
      rawBody: JSON.stringify({
        event: 'participant.joined',
        eventId: 'evt-1',
        payload: {
          providerMeetingId: 'sandbox_abc',
          providerParticipantId: 'p1',
          providerJoinId: 'j1',
          displayName: 'Ada',
        },
      }),
      headers: {},
    });
    expect(event.eventType).toBe('participant.joined');
    expect(event.providerMeetingId).toBe('sandbox_abc');
    expect(event.providerJoinId).toBe('j1');
  });
});
