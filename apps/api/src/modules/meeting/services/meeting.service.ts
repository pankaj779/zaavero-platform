import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { BusinessEmailService } from '../../email/services/business-email.service';
import {
  MEETING_AUDIT_ACTIONS,
  MEETING_AUDIT_ENTITY,
  TOKEN_REFRESH_SKEW_MS,
  type MeetingProviderValue,
  type ProvisionableMeetingProvider,
} from '../constants/meeting.constants';
import { MEETING_PROVIDER_REGISTRY, MEETING_REPOSITORY } from '../constants/injection-tokens';
import {
  InvalidMeetingRequestException,
  MeetingProviderNotConfiguredException,
  MeetingSandboxForbiddenException,
} from '../exceptions';
import type {
  LiveSessionMeetingRecord,
  MeetingIntegrationRecord,
  MeetingRepository,
} from '../interfaces/meeting-repository.interface';
import type { MeetingProviderCredentials } from '../providers/meeting-provider.interface';
import type { MeetingProviderRegistry } from '../providers/meeting-provider.registry';
import { MeetingTokenService } from './meeting-token.service';

export interface ProvisionLiveSessionMeetingInput {
  liveSessionId: string;
  organizationId: string;
  batchId: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  meetingProvider?: MeetingProviderValue | null;
  timezone?: string;
  recurrenceRule?: string | null;
  actorUserId?: string | null;
  /** When true, skip provider call and leave manual meetingUrl as-is. */
  manualMeetingUrl?: string | null;
}

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    @Inject(MEETING_REPOSITORY) private readonly repo: MeetingRepository,
    @Inject(MEETING_PROVIDER_REGISTRY) private readonly registry: MeetingProviderRegistry,
    private readonly tokens: MeetingTokenService,
    private readonly config: ConfigService<EnvConfig, true>,
    @Optional() private readonly businessEmail?: BusinessEmailService,
  ) {}

  /**
   * Provision a provider meeting for a live session after the session row exists.
   * Sandbox is the default outside production when no provider is selected / NONE.
   */
  async provisionForLiveSession(
    input: ProvisionLiveSessionMeetingInput,
  ): Promise<LiveSessionMeetingRecord> {
    if (input.manualMeetingUrl) {
      return this.repo.updateLiveSessionMeeting(input.liveSessionId, {
        meetingUrl: input.manualMeetingUrl,
        meetingProvider: input.meetingProvider ?? 'CUSTOM',
        syncStatus: 'IDLE',
        syncError: null,
        updatedById: input.actorUserId,
      });
    }

    const providerName = this.resolveProvider(input.meetingProvider);
    if (providerName === 'NONE' || providerName === 'CUSTOM') {
      return this.repo.findLiveSessionById(input.liveSessionId).then((row) => {
        if (!row) throw new InvalidMeetingRequestException('Live session not found.');
        return row;
      });
    }

    await this.repo.updateLiveSessionMeeting(input.liveSessionId, {
      syncStatus: 'SYNCING',
      syncError: null,
      meetingProvider: providerName,
      updatedById: input.actorUserId,
    });

    try {
      const { integration, credentials } = await this.resolveCredentials(
        input.organizationId,
        providerName,
        input.actorUserId,
      );
      const provider = this.registry.get(providerName);
      const result = await provider.createMeeting(credentials, {
        organizationId: input.organizationId,
        liveSessionId: input.liveSessionId,
        title: input.title,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: input.timezone ?? 'Asia/Kolkata',
        recurrenceRule: input.recurrenceRule,
        waitingRoom: true,
        muteOnEntry: true,
      });

      const updated = await this.repo.updateLiveSessionMeeting(input.liveSessionId, {
        meetingIntegrationId: integration.id,
        meetingProvider: providerName,
        providerMeetingId: result.providerMeetingId,
        meetingUrl: result.joinUrl,
        hostUrlEncrypted: result.hostUrl
          ? this.tokens.encryptHostSecret(result.hostUrl)
          : null,
        passcodeEncrypted: result.passcode
          ? this.tokens.encryptHostSecret(result.passcode)
          : null,
        timezone: result.timezone ?? input.timezone ?? 'Asia/Kolkata',
        recurrenceRule: result.recurrenceRule ?? input.recurrenceRule ?? null,
        providerMetadata: result.metadata ?? {},
        syncStatus: 'SYNCED',
        syncError: null,
        updatedById: input.actorUserId,
      });

      await this.syncCalendar(updated);
      await this.notifyStudents(updated, 'live_session_scheduled');
      await this.repo.audit({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: MEETING_AUDIT_ACTIONS.meetingProvisioned,
        entityType: MEETING_AUDIT_ENTITY,
        entityId: updated.id,
        metadata: { provider: providerName, providerMeetingId: result.providerMeetingId },
      });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Meeting provisioning failed.';
      this.logger.error(`Provision failed for ${input.liveSessionId}: ${message}`);
      return this.repo.updateLiveSessionMeeting(input.liveSessionId, {
        syncStatus: 'FAILED',
        syncError: message,
        updatedById: input.actorUserId,
      });
    }
  }

  async syncForLiveSession(input: {
    liveSessionId: string;
    actorUserId?: string | null;
    title?: string;
    description?: string | null;
    startsAt?: Date;
    endsAt?: Date | null;
    timezone?: string;
    recurrenceRule?: string | null;
    meetingProvider?: MeetingProviderValue | null;
    meetingUrl?: string | null;
  }): Promise<LiveSessionMeetingRecord> {
    const session = await this.requireSession(input.liveSessionId);
    if (input.meetingUrl) {
      return this.repo.updateLiveSessionMeeting(session.id, {
        meetingUrl: input.meetingUrl,
        updatedById: input.actorUserId,
      });
    }

    const providerName = (input.meetingProvider ??
      session.meetingProvider);
    if (
      !session.providerMeetingId ||
      providerName === 'NONE' ||
      providerName === 'CUSTOM'
    ) {
      // Re-provision if provider newly selected.
      if (
        input.meetingProvider &&
        input.meetingProvider !== 'NONE' &&
        input.meetingProvider !== 'CUSTOM' &&
        !session.providerMeetingId
      ) {
        return this.provisionForLiveSession({
          liveSessionId: session.id,
          organizationId: session.organizationId,
          batchId: session.batchId,
          title: input.title ?? session.title,
          description: input.description ?? session.description,
          startsAt: input.startsAt ?? session.startsAt,
          endsAt: input.endsAt === undefined ? session.endsAt : input.endsAt,
          meetingProvider: input.meetingProvider,
          timezone: input.timezone ?? session.timezone,
          recurrenceRule: input.recurrenceRule ?? session.recurrenceRule,
          actorUserId: input.actorUserId,
        });
      }
      return session;
    }

    try {
      const { credentials } = await this.resolveCredentials(
        session.organizationId,
        providerName,
        input.actorUserId,
      );
      const provider = this.registry.get(providerName);
      const result = await provider.updateMeeting(credentials, {
        providerMeetingId: session.providerMeetingId,
        organizationId: session.organizationId,
        liveSessionId: session.id,
        title: input.title ?? session.title,
        description: input.description === undefined ? session.description : input.description,
        startsAt: input.startsAt ?? session.startsAt,
        endsAt: input.endsAt === undefined ? session.endsAt : input.endsAt,
        timezone: input.timezone ?? session.timezone,
        recurrenceRule:
          input.recurrenceRule === undefined ? session.recurrenceRule : input.recurrenceRule,
      });
      const updated = await this.repo.updateLiveSessionMeeting(session.id, {
        meetingUrl: result.joinUrl,
        hostUrlEncrypted: result.hostUrl
          ? this.tokens.encryptHostSecret(result.hostUrl)
          : session.hostUrlEncrypted,
        passcodeEncrypted: result.passcode
          ? this.tokens.encryptHostSecret(result.passcode)
          : session.passcodeEncrypted,
        providerMetadata: result.metadata ?? session.providerMetadata,
        syncStatus: 'SYNCED',
        syncError: null,
        updatedById: input.actorUserId,
      });
      await this.syncCalendar(updated);
      await this.repo.audit({
        organizationId: session.organizationId,
        actorUserId: input.actorUserId,
        action: MEETING_AUDIT_ACTIONS.meetingUpdated,
        entityType: MEETING_AUDIT_ENTITY,
        entityId: updated.id,
        metadata: { provider: providerName },
      });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Meeting update failed.';
      return this.repo.updateLiveSessionMeeting(session.id, {
        syncStatus: 'FAILED',
        syncError: message,
        updatedById: input.actorUserId,
      });
    }
  }

  async deleteForLiveSession(
    liveSessionId: string,
    actorUserId?: string | null,
  ): Promise<void> {
    const session = await this.requireSession(liveSessionId);
    if (!session.providerMeetingId) return;
    const providerName = session.meetingProvider;
    if (providerName === 'NONE' || providerName === 'CUSTOM') return;
    try {
      const { credentials } = await this.resolveCredentials(
        session.organizationId,
        providerName,
        actorUserId,
      );
      await this.registry
        .get(providerName)
        .deleteMeeting(credentials, session.providerMeetingId);
      await this.repo.audit({
        organizationId: session.organizationId,
        actorUserId,
        action: MEETING_AUDIT_ACTIONS.meetingDeleted,
        entityType: MEETING_AUDIT_ENTITY,
        entityId: session.id,
        metadata: { provider: providerName },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to delete provider meeting for ${liveSessionId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  async startSession(
    liveSessionId: string,
    actorUserId?: string | null,
  ): Promise<LiveSessionMeetingRecord> {
    const updated = await this.repo.updateLiveSessionMeeting(liveSessionId, {
      status: 'LIVE',
      startedAt: new Date(),
      updatedById: actorUserId,
    });
    await this.repo.audit({
      organizationId: updated.organizationId,
      actorUserId,
      action: MEETING_AUDIT_ACTIONS.meetingStarted,
      entityType: MEETING_AUDIT_ENTITY,
      entityId: updated.id,
    });
    await this.notifyStudents(updated, 'live_session_started');
    return updated;
  }

  async endSession(
    liveSessionId: string,
    actorUserId?: string | null,
  ): Promise<LiveSessionMeetingRecord> {
    const updated = await this.repo.updateLiveSessionMeeting(liveSessionId, {
      status: 'COMPLETED',
      endedAt: new Date(),
      updatedById: actorUserId,
    });
    await this.repo.audit({
      organizationId: updated.organizationId,
      actorUserId,
      action: MEETING_AUDIT_ACTIONS.meetingEnded,
      entityType: MEETING_AUDIT_ENTITY,
      entityId: updated.id,
    });
    return updated;
  }

  async cancelSession(
    liveSessionId: string,
    actorUserId?: string | null,
  ): Promise<LiveSessionMeetingRecord> {
    const session = await this.requireSession(liveSessionId);
    await this.deleteForLiveSession(liveSessionId, actorUserId);
    const updated = await this.repo.updateLiveSessionMeeting(liveSessionId, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      updatedById: actorUserId,
    });
    await this.businessEmail?.liveSessionCancelled(updated.id);
    await this.notifyStudents(updated, 'live_session_cancelled');
    await this.repo.audit({
      organizationId: session.organizationId,
      actorUserId,
      action: MEETING_AUDIT_ACTIONS.meetingCancelled,
      entityType: MEETING_AUDIT_ENTITY,
      entityId: updated.id,
    });
    return updated;
  }

  decryptHostUrl(session: LiveSessionMeetingRecord): string | null {
    return this.tokens.decryptHostSecret(session.hostUrlEncrypted);
  }

  private resolveProvider(requested?: MeetingProviderValue | null): MeetingProviderValue {
    const nodeEnv = this.config.get('NODE_ENV', { infer: true });
    const sandboxMode = this.config.get('MEETING_SANDBOX_MODE', { infer: true });
    if (requested === 'SANDBOX' && nodeEnv === 'production') {
      throw new MeetingSandboxForbiddenException();
    }
    if (!requested || requested === 'NONE') {
      if (!sandboxMode || nodeEnv === 'production') return requested ?? 'NONE';
      return 'SANDBOX';
    }
    return requested;
  }

  private async resolveCredentials(
    organizationId: string,
    providerName: ProvisionableMeetingProvider,
    actorUserId?: string | null,
  ): Promise<{ integration: MeetingIntegrationRecord; credentials: MeetingProviderCredentials }> {
    let integration = await this.repo.findIntegrationByOrgProvider(organizationId, providerName);

    if (providerName === 'SANDBOX') {
      if (integration?.status !== 'CONNECTED') {
        const encrypted = this.tokens.encryptTokens(`sandbox-${organizationId}`, 'sandbox-refresh');
        integration = await this.repo.upsertIntegration({
          organizationId,
          provider: 'SANDBOX',
          status: 'CONNECTED',
          accessTokenCipher: encrypted.ciphertext,
          refreshTokenCipher: encrypted.refreshTokenCipher,
          tokenIv: encrypted.iv,
          tokenAuthTag: encrypted.authTag,
          tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          scopes: ['sandbox'],
          externalAccountId: 'sandbox',
          externalAccountEmail: 'sandbox@graphology.local',
          connectedAt: new Date(),
          connectedById: actorUserId,
          lastError: null,
        });
      }
    }

    if (integration?.status !== 'CONNECTED') {
      throw new MeetingProviderNotConfiguredException(
        `Connect ${providerName} for this organization before scheduling meetings.`,
      );
    }

    let accessToken = this.tokens.decryptAccessToken(integration);
    let refreshToken = this.tokens.decryptRefreshToken(integration);
    const client = this.clientCredentials(providerName);

    const needsRefresh =
      !accessToken ||
      (integration.tokenExpiresAt &&
        integration.tokenExpiresAt.getTime() <= Date.now() + TOKEN_REFRESH_SKEW_MS);

    if (needsRefresh && providerName !== 'SANDBOX') {
      if (!refreshToken) {
        throw new MeetingProviderNotConfiguredException(
          `${providerName} access token expired and no refresh token is available.`,
        );
      }
      const provider = this.registry.get(providerName);
      const refreshed = await provider.refreshTokens({
        accessToken: accessToken ?? '',
        refreshToken,
        clientId: client.clientId,
        clientSecret: client.clientSecret,
      });
      const encrypted = this.tokens.encryptTokens(
        refreshed.accessToken,
        refreshed.refreshToken ?? refreshToken,
      );
      integration = await this.repo.updateIntegration(integration.id, {
        accessTokenCipher: encrypted.ciphertext,
        refreshTokenCipher: encrypted.refreshTokenCipher,
        tokenIv: encrypted.iv,
        tokenAuthTag: encrypted.authTag,
        tokenExpiresAt: refreshed.expiresAt ?? null,
        status: 'CONNECTED',
        lastError: null,
      });
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken ?? refreshToken;
    }

    if (!accessToken) {
      throw new MeetingProviderNotConfiguredException();
    }

    return {
      integration,
      credentials: {
        accessToken,
        refreshToken,
        expiresAt: integration.tokenExpiresAt,
        externalAccountId: integration.externalAccountId,
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        webhookSecret: client.webhookSecret,
        config: (integration.config as Record<string, unknown> | null) ?? null,
      },
    };
  }

  private clientCredentials(provider: ProvisionableMeetingProvider): {
    clientId: string | null;
    clientSecret: string | null;
    webhookSecret: string | null;
  } {
    if (provider === 'ZOOM') {
      return {
        clientId: this.config.get('ZOOM_CLIENT_ID', { infer: true }) ?? null,
        clientSecret: this.config.get('ZOOM_CLIENT_SECRET', { infer: true }) ?? null,
        webhookSecret: this.config.get('ZOOM_WEBHOOK_SECRET', { infer: true }) ?? null,
      };
    }
    if (provider === 'GOOGLE_MEET') {
      return {
        clientId:
          this.config.get('GOOGLE_MEET_CLIENT_ID', { infer: true }) ??
          this.config.get('GOOGLE_CLIENT_ID', { infer: true }) ??
          null,
        clientSecret:
          this.config.get('GOOGLE_MEET_CLIENT_SECRET', { infer: true }) ??
          this.config.get('GOOGLE_CLIENT_SECRET', { infer: true }) ??
          null,
        webhookSecret: null,
      };
    }
    return { clientId: 'sandbox', clientSecret: 'sandbox', webhookSecret: null };
  }

  private async syncCalendar(session: LiveSessionMeetingRecord): Promise<void> {
    const endsAt = session.endsAt ?? new Date(session.startsAt.getTime() + 60 * 60 * 1000);
    await this.repo.upsertCalendarEventForLiveSession({
      organizationId: session.organizationId,
      liveSessionId: session.id,
      title: session.title,
      description: session.description,
      startsAt: session.startsAt,
      endsAt,
      timezone: session.timezone,
      recurrenceRule: session.recurrenceRule,
    });
  }

  private async notifyStudents(
    session: LiveSessionMeetingRecord,
    type: string,
  ): Promise<void> {
    const userIds = await this.repo.listEnrolledStudentUserIds(session.batchId);
    const title =
      type === 'live_session_started'
        ? `Live class started: ${session.title}`
        : type === 'live_session_cancelled'
          ? `Live class cancelled: ${session.title}`
          : `Live class scheduled: ${session.title}`;
    await Promise.all(
      userIds.map((userId) =>
        this.repo
          .createInAppNotification({
            organizationId: session.organizationId,
            userId,
            type,
            title,
            body: session.meetingUrl
              ? `Join link: ${session.meetingUrl}`
              : session.description,
            data: {
              liveSessionId: session.id,
              meetingUrl: session.meetingUrl,
            },
            dedupeKey: `${type}:${session.id}:${userId}`,
          })
          .catch((error: unknown) => {
            this.logger.warn(
              `Notification failed for ${userId}: ${
                error instanceof Error ? error.message : 'unknown'
              }`,
            );
          }),
      ),
    );
  }

  private async requireSession(id: string): Promise<LiveSessionMeetingRecord> {
    const session = await this.repo.findLiveSessionById(id);
    if (!session) throw new InvalidMeetingRequestException('Live session not found.');
    return session;
  }
}
