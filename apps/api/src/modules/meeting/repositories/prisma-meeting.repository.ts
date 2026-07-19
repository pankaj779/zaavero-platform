import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  CreateMeetingOAuthStateData,
  CreateMeetingWebhookEventData,
  LiveSessionMeetingRecord,
  MeetingIntegrationRecord,
  MeetingOAuthStateRecord,
  MeetingParticipantRecord,
  MeetingRecordingRecord,
  MeetingRepository,
  MeetingWebhookEventRecord,
  UpdateLiveSessionMeetingData,
  UpsertCalendarForLiveSessionData,
  UpsertMeetingIntegrationData,
  UpsertParticipantData,
  UpsertRecordingData,
} from '../interfaces/meeting-repository.interface';
import type { MeetingProviderValue } from '../constants/meeting.constants';


const integrationSelect = {
  id: true,
  organizationId: true,
  provider: true,
  status: true,
  externalAccountId: true,
  externalAccountEmail: true,
  accessTokenCipher: true,
  refreshTokenCipher: true,
  tokenIv: true,
  tokenAuthTag: true,
  tokenExpiresAt: true,
  scopes: true,
  config: true,
  lastError: true,
  version: true,
  connectedAt: true,
  revokedAt: true,
  connectedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

const liveSessionSelect = {
  id: true,
  organizationId: true,
  batchId: true,
  meetingIntegrationId: true,
  title: true,
  description: true,
  status: true,
  meetingProvider: true,
  providerMeetingId: true,
  meetingUrl: true,
  hostUrlEncrypted: true,
  passcodeEncrypted: true,
  recordingUrl: true,
  timezone: true,
  recurrenceRule: true,
  providerMetadata: true,
  syncStatus: true,
  syncError: true,
  version: true,
  startsAt: true,
  endsAt: true,
  startedAt: true,
  endedAt: true,
  cancelledAt: true,
  createdById: true,
  updatedById: true,
  deletedAt: true,
} as const;

@Injectable()
export class PrismaMeetingRepository implements MeetingRepository {
  public readonly marker = 'meeting-repository' as const;

  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findIntegrationByOrgProvider(
    organizationId: string,
    provider: MeetingProviderValue,
  ): Promise<MeetingIntegrationRecord | null> {
    return this.prisma.meetingIntegration.findUnique({
      where: { organizationId_provider: { organizationId, provider } },
      select: integrationSelect,
    });
  }

  findIntegrationById(id: string): Promise<MeetingIntegrationRecord | null> {
    return this.prisma.meetingIntegration.findUnique({
      where: { id },
      select: integrationSelect,
    });
  }

  listIntegrations(organizationId: string): Promise<MeetingIntegrationRecord[]> {
    return this.prisma.meetingIntegration.findMany({
      where: { organizationId },
      select: integrationSelect,
      orderBy: { provider: 'asc' },
    });
  }

  async upsertIntegration(data: UpsertMeetingIntegrationData): Promise<MeetingIntegrationRecord> {
    return this.prisma.meetingIntegration.upsert({
      where: {
        organizationId_provider: {
          organizationId: data.organizationId,
          provider: data.provider,
        },
      },
      create: {
        organizationId: data.organizationId,
        provider: data.provider,
        status: data.status ?? 'DISCONNECTED',
        externalAccountId: data.externalAccountId,
        externalAccountEmail: data.externalAccountEmail,
        accessTokenCipher: data.accessTokenCipher,
        refreshTokenCipher: data.refreshTokenCipher,
        tokenIv: data.tokenIv,
        tokenAuthTag: data.tokenAuthTag,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes ?? [],
        config: data.config === undefined ? undefined : (data.config as never),
        lastError: data.lastError,
        connectedAt: data.connectedAt,
        revokedAt: data.revokedAt,
        connectedById: data.connectedById,
      },
      update: {
        status: data.status,
        externalAccountId: data.externalAccountId,
        externalAccountEmail: data.externalAccountEmail,
        accessTokenCipher: data.accessTokenCipher,
        refreshTokenCipher: data.refreshTokenCipher,
        tokenIv: data.tokenIv,
        tokenAuthTag: data.tokenAuthTag,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes,
        config: data.config === undefined ? undefined : (data.config as never),
        lastError: data.lastError,
        connectedAt: data.connectedAt,
        revokedAt: data.revokedAt,
        connectedById: data.connectedById,
        version: { increment: 1 },
      },
      select: integrationSelect,
    });
  }

  updateIntegration(
    id: string,
    data: Partial<UpsertMeetingIntegrationData> & { version?: number },
  ): Promise<MeetingIntegrationRecord> {
    return this.prisma.meetingIntegration.update({
      where: { id },
      data: {
        status: data.status,
        externalAccountId: data.externalAccountId,
        externalAccountEmail: data.externalAccountEmail,
        accessTokenCipher: data.accessTokenCipher,
        refreshTokenCipher: data.refreshTokenCipher,
        tokenIv: data.tokenIv,
        tokenAuthTag: data.tokenAuthTag,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes,
        config: data.config === undefined ? undefined : (data.config as never),
        lastError: data.lastError,
        connectedAt: data.connectedAt,
        revokedAt: data.revokedAt,
        connectedById: data.connectedById,
        version: data.version ?? { increment: 1 },
      },
      select: integrationSelect,
    });
  }

  createOAuthState(data: CreateMeetingOAuthStateData): Promise<MeetingOAuthStateRecord> {
    return this.prisma.meetingOAuthState.create({
      data: {
        organizationId: data.organizationId,
        integrationId: data.integrationId,
        userId: data.userId,
        provider: data.provider,
        stateHash: data.stateHash,
        codeVerifierCipher: data.codeVerifierCipher,
        redirectPath: data.redirectPath,
        expiresAt: data.expiresAt,
      },
    });
  }

  async consumeOAuthState(stateHash: string): Promise<MeetingOAuthStateRecord | null> {
    const existing = await this.prisma.meetingOAuthState.findUnique({ where: { stateHash } });
    if (!existing || existing.consumedAt || existing.expiresAt.getTime() < Date.now()) {
      return null;
    }
    return this.prisma.meetingOAuthState.update({
      where: { id: existing.id },
      data: { consumedAt: new Date() },
    });
  }

  async createWebhookEvent(
    data: CreateMeetingWebhookEventData,
  ): Promise<{ created: boolean; event: MeetingWebhookEventRecord }> {
    try {
      const event = await this.prisma.meetingWebhookEvent.create({
        data: {
          organizationId: data.organizationId,
          integrationId: data.integrationId,
          provider: data.provider,
          eventId: data.eventId,
          eventType: data.eventType,
          payload: data.payload as never,
          signatureHash: data.signatureHash,
          occurredAt: data.occurredAt,
        },
      });
      return { created: true, event };
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        const event = await this.prisma.meetingWebhookEvent.findUnique({
          where: {
            provider_eventId: { provider: data.provider, eventId: data.eventId },
          },
        });
        if (!event) throw error;
        return { created: false, event };
      }
      throw error;
    }
  }

  async claimWebhookEvent(
    id: string,
    lockedBy: string,
  ): Promise<MeetingWebhookEventRecord | null> {
    const result = await this.prisma.meetingWebhookEvent.updateMany({
      where: {
        id,
        OR: [
          { status: 'PENDING' },
          { status: 'FAILED' },
          {
            status: 'PROCESSING',
            lockedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
          },
        ],
      },
      data: {
        status: 'PROCESSING',
        lockedAt: new Date(),
        lockedBy,
        attempts: { increment: 1 },
      },
    });
    if (result.count === 0) return null;
    return this.prisma.meetingWebhookEvent.findUnique({ where: { id } });
  }

  updateWebhookEvent(
    id: string,
    data: {
      status?: MeetingWebhookEventRecord['status'];
      lastError?: string | null;
      processedAt?: Date | null;
      organizationId?: string | null;
      integrationId?: string | null;
      attempts?: number;
    },
  ): Promise<MeetingWebhookEventRecord> {
    return this.prisma.meetingWebhookEvent.update({
      where: { id },
      data: {
        status: data.status,
        lastError: data.lastError,
        processedAt: data.processedAt,
        organizationId: data.organizationId,
        integrationId: data.integrationId,
        attempts: data.attempts,
        lockedAt: data.status === 'PROCESSED' || data.status === 'IGNORED' ? null : undefined,
        lockedBy: data.status === 'PROCESSED' || data.status === 'IGNORED' ? null : undefined,
      },
    });
  }

  findLiveSessionById(id: string): Promise<LiveSessionMeetingRecord | null> {
    return this.prisma.liveSession.findFirst({
      where: { id, deletedAt: null },
      select: liveSessionSelect,
    });
  }

  findLiveSessionByProviderMeetingId(
    provider: MeetingProviderValue,
    providerMeetingId: string,
  ): Promise<LiveSessionMeetingRecord | null> {
    return this.prisma.liveSession.findFirst({
      where: {
        meetingProvider: provider,
        providerMeetingId,
        deletedAt: null,
      },
      select: liveSessionSelect,
    });
  }

  updateLiveSessionMeeting(
    id: string,
    data: UpdateLiveSessionMeetingData,
  ): Promise<LiveSessionMeetingRecord> {
    return this.prisma.liveSession.update({
      where: { id },
      data: {
        meetingIntegrationId: data.meetingIntegrationId,
        meetingProvider: data.meetingProvider,
        providerMeetingId: data.providerMeetingId,
        meetingUrl: data.meetingUrl,
        hostUrlEncrypted: data.hostUrlEncrypted,
        passcodeEncrypted: data.passcodeEncrypted,
        recordingUrl: data.recordingUrl,
        timezone: data.timezone,
        recurrenceRule: data.recurrenceRule,
        providerMetadata:
          data.providerMetadata === undefined
            ? undefined
            : (data.providerMetadata as never),
        syncStatus: data.syncStatus,
        syncError: data.syncError,
        status: data.status as never,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        cancelledAt: data.cancelledAt,
        updatedById: data.updatedById,
        version: data.version ?? { increment: 1 },
      },
      select: liveSessionSelect,
    });
  }

  upsertParticipant(data: UpsertParticipantData): Promise<MeetingParticipantRecord> {
    return this.prisma.meetingParticipant.upsert({
      where: {
        liveSessionId_providerJoinId: {
          liveSessionId: data.liveSessionId,
          providerJoinId: data.providerJoinId,
        },
      },
      create: {
        organizationId: data.organizationId,
        liveSessionId: data.liveSessionId,
        userId: data.userId,
        studentId: data.studentId,
        providerParticipantId: data.providerParticipantId,
        providerJoinId: data.providerJoinId,
        displayName: data.displayName,
        emailHash: data.emailHash,
        joinedAt: data.joinedAt,
        leftAt: data.leftAt,
        durationSeconds: data.durationSeconds ?? 0,
        source: data.source ?? 'PROVIDER',
      },
      update: {
        displayName: data.displayName,
        leftAt: data.leftAt,
        durationSeconds: data.durationSeconds,
        userId: data.userId,
        studentId: data.studentId,
      },
    });
  }

  async closeParticipant(
    liveSessionId: string,
    providerJoinId: string,
    leftAt: Date,
  ): Promise<MeetingParticipantRecord | null> {
    const existing = await this.prisma.meetingParticipant.findUnique({
      where: { liveSessionId_providerJoinId: { liveSessionId, providerJoinId } },
    });
    if (!existing) return null;
    const durationSeconds = Math.max(
      0,
      Math.round((leftAt.getTime() - existing.joinedAt.getTime()) / 1000),
    );
    return this.prisma.meetingParticipant.update({
      where: { id: existing.id },
      data: { leftAt, durationSeconds },
    });
  }

  upsertRecording(data: UpsertRecordingData): Promise<MeetingRecordingRecord> {
    return this.prisma.meetingRecording.upsert({
      where: {
        liveSessionId_providerRecordingId: {
          liveSessionId: data.liveSessionId,
          providerRecordingId: data.providerRecordingId,
        },
      },
      create: {
        organizationId: data.organizationId,
        liveSessionId: data.liveSessionId,
        providerRecordingId: data.providerRecordingId,
        status: data.status ?? 'AVAILABLE',
        playUrl: data.playUrl,
        downloadUrl: data.downloadUrl,
        durationSeconds: data.durationSeconds,
        availableAt: data.availableAt ?? new Date(),
        mediaAssetId: data.mediaAssetId,
      },
      update: {
        status: data.status,
        playUrl: data.playUrl,
        downloadUrl: data.downloadUrl,
        durationSeconds: data.durationSeconds,
        availableAt: data.availableAt,
        mediaAssetId: data.mediaAssetId,
      },
      select: {
        id: true,
        organizationId: true,
        liveSessionId: true,
        providerRecordingId: true,
        mediaAssetId: true,
        status: true,
        playUrl: true,
        downloadUrl: true,
        durationSeconds: true,
        availableAt: true,
      },
    });
  }

  async upsertCalendarEventForLiveSession(
    data: UpsertCalendarForLiveSessionData,
  ): Promise<{ id: string }> {
    const existing = await this.prisma.calendarEvent.findFirst({
      where: {
        organizationId: data.organizationId,
        liveSessionId: data.liveSessionId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      return this.prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          description: data.description,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          timezone: data.timezone,
          recurrenceRule: data.recurrenceRule,
          syncStatus: 'SYNCED',
          syncError: null,
        },
        select: { id: true },
      });
    }
    return this.prisma.calendarEvent.create({
      data: {
        organizationId: data.organizationId,
        liveSessionId: data.liveSessionId,
        title: data.title,
        description: data.description,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        timezone: data.timezone,
        recurrenceRule: data.recurrenceRule,
        syncStatus: 'SYNCED',
      },
      select: { id: true },
    });
  }

  findStudentIdByEmailHash(
    organizationId: string,
    emailHash: string,
  ): Promise<{ studentId: string; userId: string } | null> {
    void organizationId;
    void emailHash;
    return Promise.resolve(null);
  }

  async listEnrolledStudentUserIds(batchId: string): Promise<string[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: {
        batchId,
        NOT: { status: 'DROPPED' },
        student: { deletedAt: null },
      },
      select: { student: { select: { userId: true } } },
    });
    return rows.map((row) => row.student.userId);
  }

  async createInAppNotification(data: {
    organizationId: string;
    userId: string;
    type: string;
    title: string;
    body?: string | null;
    data?: Record<string, unknown>;
    dedupeKey?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          channel: 'IN_APP',
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data === undefined ? undefined : (data.data as never),
          dedupeKey: data.dedupeKey,
        },
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  async audit(entry: {
    organizationId: string;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.actorUserId,
        action: entry.action,
        entity: entry.entityType,
        entityId: entry.entityId,
        metadata: {
          organizationId: entry.organizationId,
          ...(entry.metadata ?? {}),
        } as never,
      },
    });
  }
}
