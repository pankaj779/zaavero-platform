import type {
  MeetingIntegrationStatusValue,
  MeetingProviderValue,
  MeetingRecordingStatusValue,
  MeetingSyncStatusValue,
  MeetingWebhookStatusValue,
} from '../constants/meeting.constants';

export interface MeetingIntegrationRecord {
  id: string;
  organizationId: string;
  provider: MeetingProviderValue;
  status: MeetingIntegrationStatusValue;
  externalAccountId: string | null;
  externalAccountEmail: string | null;
  accessTokenCipher: string | null;
  refreshTokenCipher: string | null;
  tokenIv: string | null;
  tokenAuthTag: string | null;
  tokenExpiresAt: Date | null;
  scopes: string[];
  config: unknown;
  lastError: string | null;
  version: number;
  connectedAt: Date | null;
  revokedAt: Date | null;
  connectedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingOAuthStateRecord {
  id: string;
  organizationId: string;
  integrationId: string | null;
  userId: string;
  provider: MeetingProviderValue;
  stateHash: string;
  codeVerifierCipher: string;
  redirectPath: string | null;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface MeetingWebhookEventRecord {
  id: string;
  organizationId: string | null;
  integrationId: string | null;
  provider: MeetingProviderValue;
  eventId: string;
  eventType: string;
  status: MeetingWebhookStatusValue;
  payload: unknown;
  signatureHash: string;
  attempts: number;
  lockedAt: Date | null;
  lockedBy: string | null;
  lastError: string | null;
  occurredAt: Date | null;
  processedAt: Date | null;
  receivedAt: Date;
  updatedAt: Date;
}

export interface MeetingParticipantRecord {
  id: string;
  organizationId: string;
  liveSessionId: string;
  userId: string | null;
  studentId: string | null;
  providerParticipantId: string;
  providerJoinId: string;
  displayName: string | null;
  emailHash: string | null;
  joinedAt: Date;
  leftAt: Date | null;
  durationSeconds: number;
  source: string;
}

export interface MeetingRecordingRecord {
  id: string;
  organizationId: string;
  liveSessionId: string;
  providerRecordingId: string;
  mediaAssetId: string | null;
  status: MeetingRecordingStatusValue;
  playUrl: string | null;
  downloadUrl: string | null;
  durationSeconds: number | null;
  availableAt: Date | null;
}

export interface LiveSessionMeetingRecord {
  id: string;
  organizationId: string;
  batchId: string;
  meetingIntegrationId: string | null;
  title: string;
  description: string | null;
  status: string;
  meetingProvider: MeetingProviderValue;
  providerMeetingId: string | null;
  meetingUrl: string | null;
  hostUrlEncrypted: string | null;
  passcodeEncrypted: string | null;
  recordingUrl: string | null;
  timezone: string;
  recurrenceRule: string | null;
  providerMetadata: unknown;
  syncStatus: MeetingSyncStatusValue;
  syncError: string | null;
  version: number;
  startsAt: Date;
  endsAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  cancelledAt: Date | null;
  createdById: string | null;
  updatedById: string | null;
  deletedAt: Date | null;
}

export interface UpsertMeetingIntegrationData {
  organizationId: string;
  provider: MeetingProviderValue;
  status?: MeetingIntegrationStatusValue;
  externalAccountId?: string | null;
  externalAccountEmail?: string | null;
  accessTokenCipher?: string | null;
  refreshTokenCipher?: string | null;
  tokenIv?: string | null;
  tokenAuthTag?: string | null;
  tokenExpiresAt?: Date | null;
  scopes?: string[];
  config?: unknown;
  lastError?: string | null;
  connectedAt?: Date | null;
  revokedAt?: Date | null;
  connectedById?: string | null;
}

export interface CreateMeetingOAuthStateData {
  organizationId: string;
  integrationId?: string | null;
  userId: string;
  provider: MeetingProviderValue;
  stateHash: string;
  codeVerifierCipher: string;
  redirectPath?: string | null;
  expiresAt: Date;
}

export interface CreateMeetingWebhookEventData {
  organizationId?: string | null;
  integrationId?: string | null;
  provider: MeetingProviderValue;
  eventId: string;
  eventType: string;
  payload: unknown;
  signatureHash: string;
  occurredAt?: Date | null;
}

export interface UpdateLiveSessionMeetingData {
  meetingIntegrationId?: string | null;
  meetingProvider?: MeetingProviderValue;
  providerMeetingId?: string | null;
  meetingUrl?: string | null;
  hostUrlEncrypted?: string | null;
  passcodeEncrypted?: string | null;
  recordingUrl?: string | null;
  timezone?: string;
  recurrenceRule?: string | null;
  providerMetadata?: unknown;
  syncStatus?: MeetingSyncStatusValue;
  syncError?: string | null;
  status?: string;
  startsAt?: Date;
  endsAt?: Date | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  cancelledAt?: Date | null;
  updatedById?: string | null;
  version?: number;
}

export interface UpsertParticipantData {
  organizationId: string;
  liveSessionId: string;
  userId?: string | null;
  studentId?: string | null;
  providerParticipantId: string;
  providerJoinId: string;
  displayName?: string | null;
  emailHash?: string | null;
  joinedAt: Date;
  leftAt?: Date | null;
  durationSeconds?: number;
  source?: string;
}

export interface UpsertRecordingData {
  organizationId: string;
  liveSessionId: string;
  providerRecordingId: string;
  status?: MeetingRecordingStatusValue;
  playUrl?: string | null;
  downloadUrl?: string | null;
  durationSeconds?: number | null;
  availableAt?: Date | null;
  mediaAssetId?: string | null;
}

export interface UpsertCalendarForLiveSessionData {
  organizationId: string;
  liveSessionId: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  recurrenceRule?: string | null;
}

export interface MeetingRepository {
  readonly marker: 'meeting-repository';

  findIntegrationByOrgProvider(
    organizationId: string,
    provider: MeetingProviderValue,
  ): Promise<MeetingIntegrationRecord | null>;
  findIntegrationById(id: string): Promise<MeetingIntegrationRecord | null>;
  listIntegrations(organizationId: string): Promise<MeetingIntegrationRecord[]>;
  upsertIntegration(data: UpsertMeetingIntegrationData): Promise<MeetingIntegrationRecord>;
  updateIntegration(
    id: string,
    data: Partial<UpsertMeetingIntegrationData> & { version?: number },
  ): Promise<MeetingIntegrationRecord>;

  createOAuthState(data: CreateMeetingOAuthStateData): Promise<MeetingOAuthStateRecord>;
  consumeOAuthState(stateHash: string): Promise<MeetingOAuthStateRecord | null>;

  createWebhookEvent(
    data: CreateMeetingWebhookEventData,
  ): Promise<{ created: boolean; event: MeetingWebhookEventRecord }>;
  claimWebhookEvent(
    id: string,
    lockedBy: string,
  ): Promise<MeetingWebhookEventRecord | null>;
  updateWebhookEvent(
    id: string,
    data: {
      status?: MeetingWebhookStatusValue;
      lastError?: string | null;
      processedAt?: Date | null;
      organizationId?: string | null;
      integrationId?: string | null;
      attempts?: number;
    },
  ): Promise<MeetingWebhookEventRecord>;

  findLiveSessionById(id: string): Promise<LiveSessionMeetingRecord | null>;
  findLiveSessionByProviderMeetingId(
    provider: MeetingProviderValue,
    providerMeetingId: string,
  ): Promise<LiveSessionMeetingRecord | null>;
  updateLiveSessionMeeting(
    id: string,
    data: UpdateLiveSessionMeetingData,
  ): Promise<LiveSessionMeetingRecord>;

  upsertParticipant(data: UpsertParticipantData): Promise<MeetingParticipantRecord>;
  closeParticipant(
    liveSessionId: string,
    providerJoinId: string,
    leftAt: Date,
  ): Promise<MeetingParticipantRecord | null>;
  upsertRecording(data: UpsertRecordingData): Promise<MeetingRecordingRecord>;

  upsertCalendarEventForLiveSession(
    data: UpsertCalendarForLiveSessionData,
  ): Promise<{ id: string }>;

  findStudentIdByEmailHash(
    organizationId: string,
    emailHash: string,
  ): Promise<{ studentId: string; userId: string } | null>;

  listEnrolledStudentUserIds(batchId: string): Promise<string[]>;

  createInAppNotification(data: {
    organizationId: string;
    userId: string;
    type: string;
    title: string;
    body?: string | null;
    data?: Record<string, unknown>;
    dedupeKey?: string | null;
  }): Promise<void>;

  audit(entry: {
    organizationId: string;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
