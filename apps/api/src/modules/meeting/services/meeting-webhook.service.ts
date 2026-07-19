import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import {
  MEETING_AUDIT_ACTIONS,
  MEETING_AUDIT_ENTITY,
  type MeetingProviderValue,
  type ProvisionableMeetingProvider,
} from '../constants/meeting.constants';
import { MEETING_PROVIDER_REGISTRY, MEETING_REPOSITORY } from '../constants/injection-tokens';
import { InvalidMeetingWebhookException } from '../exceptions';
import type { MeetingRepository } from '../interfaces/meeting-repository.interface';
import type { NormalizedMeetingWebhookEvent } from '../providers/meeting-provider.interface';
import type { MeetingProviderRegistry } from '../providers/meeting-provider.registry';
import { hashValue } from '../utils/token-encryption';
import { MeetingTokenService } from './meeting-token.service';

@Injectable()
export class MeetingWebhookService {
  private readonly logger = new Logger(MeetingWebhookService.name);

  constructor(
    @Inject(MEETING_REPOSITORY) private readonly repo: MeetingRepository,
    @Inject(MEETING_PROVIDER_REGISTRY) private readonly registry: MeetingProviderRegistry,
    private readonly tokens: MeetingTokenService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async handle(
    providerName: ProvisionableMeetingProvider,
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<{
    received: boolean;
    duplicate?: boolean;
    processed?: boolean;
    challengeResponse?: Record<string, unknown> | null;
  }> {
    const provider = this.registry.get(providerName);
    const webhookSecret =
      providerName === 'ZOOM'
        ? (this.config.get('ZOOM_WEBHOOK_SECRET', { infer: true }) ?? null)
        : null;

    let normalized: NormalizedMeetingWebhookEvent;
    try {
      normalized = provider.verifyAndParseWebhook({
        rawBody,
        headers,
        webhookSecret,
      });
    } catch (error) {
      if (error instanceof InvalidMeetingWebhookException) throw error;
      throw new InvalidMeetingWebhookException(
        error instanceof Error ? error.message : 'Webhook verification failed.',
      );
    }

    if (normalized.eventType === 'url_validation') {
      return {
        received: true,
        processed: true,
        challengeResponse: normalized.challengeResponse ?? null,
      };
    }

    const { created, event } = await this.repo.createWebhookEvent({
      provider: providerName,
      eventId: normalized.eventId,
      eventType: normalized.rawType,
      payload: normalized.payload,
      signatureHash: normalized.signatureHash || hashValue(rawBody),
      occurredAt: normalized.occurredAt ?? null,
    });

    if (!created && (event.status === 'PROCESSED' || event.status === 'IGNORED')) {
      return { received: true, duplicate: true, processed: event.status === 'PROCESSED' };
    }

    const claimed = await this.repo.claimWebhookEvent(event.id, randomUUID());
    if (!claimed) {
      return { received: true, duplicate: true, processed: false };
    }

    try {
      await this.processEvent(providerName, event.id, normalized);
      await this.repo.updateWebhookEvent(event.id, {
        status: normalized.eventType === 'unknown' ? 'IGNORED' : 'PROCESSED',
        processedAt: new Date(),
        lastError: null,
      });
      return { received: true, processed: true, duplicate: !created };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook processing failed.';
      this.logger.error(`Webhook ${event.id} failed: ${message}`);
      await this.repo.updateWebhookEvent(event.id, {
        status: 'FAILED',
        lastError: message,
      });
      return { received: true, processed: false };
    }
  }

  private async processEvent(
    providerName: MeetingProviderValue,
    webhookEventId: string,
    event: NormalizedMeetingWebhookEvent,
  ): Promise<void> {
    if (event.eventType === 'unknown') return;

    const session = event.providerMeetingId
      ? await this.repo.findLiveSessionByProviderMeetingId(
          providerName,
          event.providerMeetingId,
        )
      : null;

    if (!session) {
      this.logger.warn(
        `No live session for ${providerName} meeting ${event.providerMeetingId ?? 'n/a'}`,
      );
      return;
    }

    await this.repo.updateWebhookEvent(webhookEventId, {
      organizationId: session.organizationId,
      integrationId: session.meetingIntegrationId,
    });

    switch (event.eventType) {
      case 'meeting.started':
        await this.repo.updateLiveSessionMeeting(session.id, {
          status: 'LIVE',
          startedAt: event.occurredAt ?? new Date(),
        });
        break;
      case 'meeting.ended':
        await this.repo.updateLiveSessionMeeting(session.id, {
          status: 'COMPLETED',
          endedAt: event.occurredAt ?? new Date(),
        });
        break;
      case 'meeting.deleted':
        await this.repo.updateLiveSessionMeeting(session.id, {
          status: 'CANCELLED',
          cancelledAt: event.occurredAt ?? new Date(),
        });
        break;
      case 'meeting.updated':
        if (event.joinUrl) {
          await this.repo.updateLiveSessionMeeting(session.id, {
            meetingUrl: event.joinUrl,
            hostUrlEncrypted: event.hostUrl
              ? this.tokens.encryptHostSecret(event.hostUrl)
              : undefined,
            syncStatus: 'SYNCED',
          });
        }
        break;
      case 'participant.joined': {
        const joinId =
          event.providerJoinId ??
          `${event.providerParticipantId ?? 'unknown'}:${(event.occurredAt ?? new Date()).toISOString()}`;
        await this.repo.upsertParticipant({
          organizationId: session.organizationId,
          liveSessionId: session.id,
          providerParticipantId: event.providerParticipantId ?? joinId,
          providerJoinId: joinId,
          displayName: event.displayName,
          emailHash: event.email ? hashValue(event.email.toLowerCase()) : null,
          joinedAt: event.occurredAt ?? new Date(),
          source: 'PROVIDER',
        });
        await this.repo.audit({
          organizationId: session.organizationId,
          action: MEETING_AUDIT_ACTIONS.participantJoined,
          entityType: MEETING_AUDIT_ENTITY,
          entityId: session.id,
          metadata: { providerJoinId: joinId },
        });
        break;
      }
      case 'participant.left': {
        const joinId = event.providerJoinId ?? event.providerParticipantId;
        if (joinId) {
          await this.repo.closeParticipant(
            session.id,
            joinId,
            event.occurredAt ?? new Date(),
          );
          await this.repo.audit({
            organizationId: session.organizationId,
            action: MEETING_AUDIT_ACTIONS.participantLeft,
            entityType: MEETING_AUDIT_ENTITY,
            entityId: session.id,
            metadata: { providerJoinId: joinId },
          });
        }
        break;
      }
      case 'recording.completed': {
        const recordingId = event.providerRecordingId ?? `recording-${event.eventId}`;
        const recording = await this.repo.upsertRecording({
          organizationId: session.organizationId,
          liveSessionId: session.id,
          providerRecordingId: recordingId,
          status: 'AVAILABLE',
          playUrl: event.playUrl,
          downloadUrl: event.downloadUrl,
          durationSeconds: event.durationSeconds,
          availableAt: event.occurredAt ?? new Date(),
        });
        await this.repo.updateLiveSessionMeeting(session.id, {
          recordingUrl: event.playUrl ?? event.downloadUrl ?? session.recordingUrl,
        });
        await this.repo.audit({
          organizationId: session.organizationId,
          action: MEETING_AUDIT_ACTIONS.recordingAvailable,
          entityType: MEETING_AUDIT_ENTITY,
          entityId: recording.id,
          metadata: { liveSessionId: session.id },
        });
        break;
      }
      default:
        break;
    }

    await this.repo.audit({
      organizationId: session.organizationId,
      action: MEETING_AUDIT_ACTIONS.webhookProcessed,
      entityType: MEETING_AUDIT_ENTITY,
      entityId: session.id,
      metadata: { eventType: event.rawType, provider: providerName },
    });
  }
}
