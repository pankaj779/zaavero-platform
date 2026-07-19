import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InvalidMeetingRequestException } from '../exceptions';
import type {
  CreateProviderMeetingInput,
  MeetingOAuthAuthorizeInput,
  MeetingOAuthExchangeInput,
  MeetingOAuthTokens,
  MeetingProvider,
  MeetingProviderCredentials,
  MeetingWebhookVerificationInput,
  NormalizedMeetingWebhookEvent,
  ProviderMeetingResult,
  UpdateProviderMeetingInput,
} from './meeting-provider.interface';

@Injectable()
export class SandboxMeetingProvider implements MeetingProvider {
  readonly name = 'SANDBOX' as const;

  isConfigured(): boolean {
    return true;
  }

  buildAuthorizeUrl(input: MeetingOAuthAuthorizeInput): string {
    const url = new URL('https://sandbox.meetings.local/oauth/authorize');
    url.searchParams.set('client_id', 'sandbox');
    url.searchParams.set('redirect_uri', input.redirectUri);
    url.searchParams.set('state', input.state);
    url.searchParams.set('response_type', 'code');
    return url.toString();
  }

  exchangeCode(input: MeetingOAuthExchangeInput): Promise<MeetingOAuthTokens> {
    return Promise.resolve({
      accessToken: `sandbox-access-${input.code || randomUUID()}`,
      refreshToken: `sandbox-refresh-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      scopes: ['sandbox'],
      externalAccountId: 'sandbox-account',
      externalAccountEmail: 'sandbox@graphology.local',
    });
  }

  refreshTokens(credentials: MeetingProviderCredentials): Promise<MeetingOAuthTokens> {
    return Promise.resolve({
      accessToken: `sandbox-access-${randomUUID()}`,
      refreshToken: credentials.refreshToken ?? `sandbox-refresh-${randomUUID()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      scopes: ['sandbox'],
      externalAccountId: credentials.externalAccountId ?? 'sandbox-account',
      externalAccountEmail: 'sandbox@graphology.local',
    });
  }

  createMeeting(
    _credentials: MeetingProviderCredentials,
    input: CreateProviderMeetingInput,
  ): Promise<ProviderMeetingResult> {
    const providerMeetingId = `sandbox_${input.liveSessionId.replace(/-/g, '').slice(0, 12)}_${randomUUID().slice(0, 8)}`;
    const passcode = randomUUID().replace(/-/g, '').slice(0, 8);
    return Promise.resolve({
      provider: this.name,
      providerMeetingId,
      joinUrl: `https://sandbox.meetings.local/j/${providerMeetingId}`,
      hostUrl: `https://sandbox.meetings.local/s/${providerMeetingId}?role=host`,
      passcode,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      timezone: input.timezone,
      recurrenceRule: input.recurrenceRule ?? null,
      metadata: {
        waitingRoom: input.waitingRoom ?? true,
        muteOnEntry: input.muteOnEntry ?? true,
        sandbox: true,
      },
    });
  }

  async updateMeeting(
    credentials: MeetingProviderCredentials,
    input: UpdateProviderMeetingInput,
  ): Promise<ProviderMeetingResult> {
    if (!input.providerMeetingId) {
      throw new InvalidMeetingRequestException('providerMeetingId is required.');
    }
    const base = await this.createMeeting(credentials, {
      organizationId: input.organizationId ?? 'unknown',
      liveSessionId: input.liveSessionId ?? 'unknown',
      title: input.title ?? 'Sandbox meeting',
      description: input.description,
      startsAt: input.startsAt ?? new Date(),
      endsAt: input.endsAt,
      timezone: input.timezone ?? 'Asia/Kolkata',
      recurrenceRule: input.recurrenceRule,
      waitingRoom: input.waitingRoom,
      muteOnEntry: input.muteOnEntry,
    });
    return { ...base, providerMeetingId: input.providerMeetingId };
  }

  deleteMeeting(): Promise<void> {
    return Promise.resolve();
  }

  verifyAndParseWebhook(input: MeetingWebhookVerificationInput): NormalizedMeetingWebhookEvent {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(input.rawBody) as Record<string, unknown>;
    } catch {
      throw new InvalidMeetingRequestException('Sandbox webhook body must be JSON.');
    }
    const rawType = typeof payload.event === 'string' ? payload.event : 'unknown';
    const eventId =
      (typeof payload.eventId === 'string' && payload.eventId) ||
      createHash('sha256').update(input.rawBody).digest('hex');
    const object =
      payload.payload && typeof payload.payload === 'object'
        ? (payload.payload as Record<string, unknown>)
        : payload;

    return {
      eventId,
      eventType: this.mapType(rawType),
      rawType,
      occurredAt: new Date(),
      providerMeetingId:
        typeof object.providerMeetingId === 'string' ? object.providerMeetingId : null,
      providerParticipantId:
        typeof object.providerParticipantId === 'string' ? object.providerParticipantId : null,
      providerJoinId: typeof object.providerJoinId === 'string' ? object.providerJoinId : null,
      providerRecordingId:
        typeof object.providerRecordingId === 'string' ? object.providerRecordingId : null,
      displayName: typeof object.displayName === 'string' ? object.displayName : null,
      email: typeof object.email === 'string' ? object.email : null,
      joinUrl: typeof object.joinUrl === 'string' ? object.joinUrl : null,
      playUrl: typeof object.playUrl === 'string' ? object.playUrl : null,
      downloadUrl: typeof object.downloadUrl === 'string' ? object.downloadUrl : null,
      durationSeconds:
        typeof object.durationSeconds === 'number' ? object.durationSeconds : null,
      payload,
      signatureHash: createHash('sha256').update(`sandbox:${input.rawBody}`).digest('hex'),
    };
  }

  private mapType(rawType: string): NormalizedMeetingWebhookEvent['eventType'] {
    switch (rawType) {
      case 'meeting.created':
      case 'meeting.updated':
      case 'meeting.deleted':
      case 'meeting.started':
      case 'meeting.ended':
      case 'recording.completed':
      case 'participant.joined':
      case 'participant.left':
        return rawType;
      default:
        return 'unknown';
    }
  }
}
