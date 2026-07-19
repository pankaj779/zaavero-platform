import type { MeetingProviderValue } from '../constants/meeting.constants';

export interface MeetingOAuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: string[];
  externalAccountId?: string | null;
  externalAccountEmail?: string | null;
}

export interface MeetingProviderCredentials {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  externalAccountId?: string | null;
  /** Provider app credentials (Zoom client id/secret, Google client id/secret). */
  clientId?: string | null;
  clientSecret?: string | null;
  webhookSecret?: string | null;
  config?: Record<string, unknown> | null;
}

export interface CreateProviderMeetingInput {
  organizationId: string;
  liveSessionId: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  timezone: string;
  recurrenceRule?: string | null;
  waitingRoom?: boolean;
  muteOnEntry?: boolean;
  hostEmail?: string | null;
  attendeeEmails?: string[];
}

export interface UpdateProviderMeetingInput extends Partial<CreateProviderMeetingInput> {
  providerMeetingId: string;
}

export interface ProviderMeetingResult {
  provider: MeetingProviderValue;
  providerMeetingId: string;
  joinUrl: string;
  hostUrl?: string | null;
  passcode?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  timezone?: string | null;
  recurrenceRule?: string | null;
  metadata?: Record<string, unknown>;
}

export interface MeetingOAuthAuthorizeInput {
  organizationId: string;
  redirectUri: string;
  state: string;
  codeChallenge?: string;
  scopes?: string[];
}

export interface MeetingOAuthExchangeInput {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  clientId?: string | null;
  clientSecret?: string | null;
}

export interface MeetingWebhookVerificationInput {
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
  webhookSecret?: string | null;
}

export type MeetingWebhookEventKind =
  | 'url_validation'
  | 'meeting.created'
  | 'meeting.updated'
  | 'meeting.deleted'
  | 'meeting.started'
  | 'meeting.ended'
  | 'recording.completed'
  | 'participant.joined'
  | 'participant.left'
  | 'unknown';

export interface NormalizedMeetingWebhookEvent {
  eventId: string;
  eventType: MeetingWebhookEventKind;
  rawType: string;
  occurredAt?: Date | null;
  providerMeetingId?: string | null;
  providerParticipantId?: string | null;
  providerJoinId?: string | null;
  providerRecordingId?: string | null;
  displayName?: string | null;
  email?: string | null;
  joinUrl?: string | null;
  hostUrl?: string | null;
  playUrl?: string | null;
  downloadUrl?: string | null;
  durationSeconds?: number | null;
  /** CRC / challenge response for Zoom url_validation. */
  challengeResponse?: Record<string, unknown> | null;
  payload: Record<string, unknown>;
  signatureHash: string;
}

/**
 * Provider-agnostic meeting contract. Zoom, Google Meet, and Sandbox
 * implement this; MeetingService never branches on provider specifics.
 */
export interface MeetingProvider {
  readonly name: MeetingProviderValue;
  isConfigured(credentials?: MeetingProviderCredentials | null): boolean;
  buildAuthorizeUrl(input: MeetingOAuthAuthorizeInput): string;
  exchangeCode(input: MeetingOAuthExchangeInput): Promise<MeetingOAuthTokens>;
  refreshTokens(credentials: MeetingProviderCredentials): Promise<MeetingOAuthTokens>;
  createMeeting(
    credentials: MeetingProviderCredentials,
    input: CreateProviderMeetingInput,
  ): Promise<ProviderMeetingResult>;
  updateMeeting(
    credentials: MeetingProviderCredentials,
    input: UpdateProviderMeetingInput,
  ): Promise<ProviderMeetingResult>;
  deleteMeeting(
    credentials: MeetingProviderCredentials,
    providerMeetingId: string,
  ): Promise<void>;
  verifyAndParseWebhook(
    input: MeetingWebhookVerificationInput,
  ): NormalizedMeetingWebhookEvent;
}
