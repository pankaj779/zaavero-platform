import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  CreateEmailLogData,
  EmailAttachmentMetadataInput,
  EmailDeliveryStatusValue,
  EmailEventTypeValue,
  EmailListFilters,
  EmailLogRecord,
  EmailPreferenceRecord,
  EmailQueueRecord,
  EmailRepository,
  EmailStats,
  EmailTemplateRecord,
  EnqueueEmailData,
} from '../interfaces/email-repository.interface';

const queueSelect = {
  id: true,
  organizationId: true,
  userId: true,
  templateId: true,
  createdById: true,
  templateKey: true,
  templateVersion: true,
  variables: true,
  fromAddress: true,
  replyTo: true,
  to: true,
  cc: true,
  bcc: true,
  renderedSubject: true,
  renderedHtml: true,
  renderedText: true,
  headers: true,
  tags: true,
  attachmentDescriptors: true,
  category: true,
  status: true,
  priority: true,
  scheduledAt: true,
  availableAt: true,
  lockedAt: true,
  lockedBy: true,
  processedAt: true,
  attempts: true,
  maxAttempts: true,
  backoffSeconds: true,
  lastErrorCode: true,
  lastErrorMessage: true,
  deadLetteredAt: true,
  cancelledAt: true,
  cancelReason: true,
  idempotencyKey: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} as const;

const logSelect = {
  id: true,
  organizationId: true,
  queueId: true,
  providerMessageId: true,
  to: true,
  subject: true,
  templateKey: true,
  category: true,
  status: true,
  attempts: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  bouncedAt: true,
  complainedAt: true,
  failedAt: true,
  errorCode: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} as const;

const templateSelect = {
  id: true,
  organizationId: true,
  key: true,
  locale: true,
  version: true,
  subject: true,
  html: true,
  text: true,
  preview: true,
  variableSchema: true,
  category: true,
  status: true,
} as const;

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class PrismaEmailRepository implements EmailRepository {
  readonly marker = 'email-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async enqueue(data: EnqueueEmailData): Promise<{ created: boolean; queue: EmailQueueRecord }> {
    try {
      const queue = await this.prisma.emailQueue.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          createdById: data.createdById,
          templateId: data.templateId,
          templateKey: data.templateKey,
          templateVersion: data.templateVersion,
          variables: data.variables as never,
          fromAddress: data.fromAddress,
          replyTo: data.replyTo,
          to: data.to,
          cc: data.cc ?? [],
          bcc: data.bcc ?? [],
          renderedSubject: data.renderedSubject,
          renderedHtml: data.renderedHtml,
          renderedText: data.renderedText,
          headers: data.headers as never,
          tags: data.tags as never,
          attachmentDescriptors: data.attachmentDescriptors as never,
          category: data.category,
          priority: data.priority ?? 0,
          scheduledAt: data.scheduledAt,
          availableAt: data.scheduledAt ?? new Date(),
          maxAttempts: data.maxAttempts,
          idempotencyKey: data.idempotencyKey,
          correlationId: data.correlationId,
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: data.metadata as never,
        },
        select: queueSelect,
      });
      return { created: true, queue };
    } catch (error: unknown) {
      if (!isUniqueConflict(error)) throw error;
      const queue = await this.prisma.emailQueue.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: data.organizationId,
            idempotencyKey: data.idempotencyKey,
          },
        },
        select: queueSelect,
      });
      if (!queue) throw error;
      return { created: false, queue };
    }
  }

  async claimNextBatch(
    workerId: string,
    batchSize: number,
    now: Date,
  ): Promise<EmailQueueRecord[]> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM email_queue
         WHERE status IN ('QUEUED'::email_queue_status, 'FAILED'::email_queue_status)
           AND available_at <= $1
           AND (scheduled_at IS NULL OR scheduled_at <= $1)
         ORDER BY priority DESC, available_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $2`,
        now,
        batchSize,
      );
      const ids = rows.map(({ id }) => id);
      if (ids.length === 0) return [];
      await tx.emailQueue.updateMany({
        where: { id: { in: ids }, status: { in: ['QUEUED', 'FAILED'] } },
        data: {
          status: 'PROCESSING',
          lockedAt: now,
          lockedBy: workerId,
          attempts: { increment: 1 },
        },
      });
      return tx.emailQueue.findMany({
        where: { id: { in: ids }, lockedBy: workerId, status: 'PROCESSING' },
        select: queueSelect,
        orderBy: [{ priority: 'desc' }, { availableAt: 'asc' }],
      });
    });
  }

  async recoverStuckProcessing(lockedBefore: Date): Promise<number> {
    const result = await this.prisma.emailQueue.updateMany({
      where: { status: 'PROCESSING', lockedAt: { lt: lockedBefore } },
      data: { status: 'QUEUED', lockedAt: null, lockedBy: null, availableAt: new Date() },
    });
    return result.count;
  }

  async markSent(organizationId: string, queueId: string): Promise<void> {
    await this.prisma.emailQueue.updateMany({
      where: { id: queueId, organizationId, status: 'PROCESSING' },
      data: { status: 'SENT', processedAt: new Date(), lockedAt: null, lockedBy: null },
    });
  }

  async markFailed(
    organizationId: string,
    queueId: string,
    errorCode: string,
    errorMessage: string,
    availableAt: Date,
  ): Promise<void> {
    await this.prisma.emailQueue.updateMany({
      where: { id: queueId, organizationId, status: 'PROCESSING' },
      data: {
        status: 'FAILED',
        availableAt,
        lockedAt: null,
        lockedBy: null,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
      },
    });
  }

  async markDeadLetter(
    organizationId: string,
    queueId: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    await this.prisma.emailQueue.updateMany({
      where: { id: queueId, organizationId, status: 'PROCESSING' },
      data: {
        status: 'DEAD_LETTER',
        deadLetteredAt: new Date(),
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
      },
    });
  }

  async cancel(organizationId: string, queueId: string, reason?: string): Promise<boolean> {
    const result = await this.prisma.emailQueue.updateMany({
      where: { id: queueId, organizationId, status: { in: ['QUEUED', 'FAILED', 'DEAD_LETTER'] } },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        lockedAt: null,
        lockedBy: null,
      },
    });
    return result.count === 1;
  }

  async retryDeadLetter(organizationId: string, queueId: string): Promise<boolean> {
    const result = await this.prisma.emailQueue.updateMany({
      where: { id: queueId, organizationId, status: { in: ['FAILED', 'DEAD_LETTER'] } },
      data: {
        status: 'QUEUED',
        attempts: 0,
        availableAt: new Date(),
        deadLetteredAt: null,
        processedAt: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
    return result.count === 1;
  }

  async createAttachmentMetadata(
    organizationId: string,
    queueId: string,
    attachments: EmailAttachmentMetadataInput[],
  ): Promise<void> {
    if (attachments.length === 0) return;
    const queue = await this.prisma.emailQueue.findFirst({
      where: { id: queueId, organizationId },
      select: { id: true },
    });
    if (!queue) return;
    await this.prisma.emailAttachment.createMany({
      data: attachments.map((attachment) => ({
        organizationId,
        queueId,
        filename: attachment.filename,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        url: attachment.url,
        contentId: attachment.contentId,
        disposition: attachment.disposition ?? 'ATTACHMENT',
        checksum: attachment.checksum,
        metadata: attachment.metadata as never,
      })),
    });
  }

  async createLog(data: CreateEmailLogData): Promise<EmailLogRecord> {
    const now = new Date();
    return this.prisma.emailLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        queueId: data.queueId,
        initiatedById: data.initiatedById,
        provider: 'RESEND',
        providerMessageId: data.providerMessageId,
        fromAddress: data.fromAddress,
        replyTo: data.replyTo,
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        templateKey: data.templateKey,
        templateVersion: data.templateVersion,
        category: data.category,
        status: data.status,
        attempts: data.attempts,
        queuedAt: now,
        lastAttemptAt: now,
        ...(data.status === 'SENT' ? { sentAt: now } : {}),
        ...(data.status === 'FAILED' ? { failedAt: now } : {}),
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        metadata: data.metadata as never,
      },
      select: logSelect,
    });
  }

  async findLogByProviderMessageId(
    provider: string,
    providerMessageId: string,
  ): Promise<EmailLogRecord | null> {
    return this.prisma.emailLog.findUnique({
      where: {
        provider_providerMessageId: {
          provider: provider as never,
          providerMessageId,
        },
      },
      select: logSelect,
    });
  }

  async createEvent(data: {
    organizationId: string;
    userId?: string;
    logId?: string;
    provider: string;
    eventId: string;
    providerMessageId?: string;
    type: EmailEventTypeValue;
    occurredAt: Date;
    payload: Record<string, unknown>;
    signatureHash: string;
  }): Promise<{ created: boolean; id: string }> {
    try {
      const event = await this.prisma.emailEvent.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          logId: data.logId,
          provider: data.provider as never,
          eventId: data.eventId,
          providerMessageId: data.providerMessageId,
          type: data.type,
          occurredAt: data.occurredAt,
          payload: data.payload as never,
          signatureHash: data.signatureHash,
        },
        select: { id: true },
      });
      return { created: true, id: event.id };
    } catch (error: unknown) {
      if (!isUniqueConflict(error)) throw error;
      const event = await this.prisma.emailEvent.findUnique({
        where: {
          provider_eventId: { provider: data.provider as never, eventId: data.eventId },
        },
        select: { id: true },
      });
      if (!event) throw error;
      return { created: false, id: event.id };
    }
  }

  async processEvent(eventId: string, logId?: string): Promise<void> {
    await this.prisma.emailEvent.update({
      where: { id: eventId },
      data: {
        status: 'PROCESSED',
        attempts: { increment: 1 },
        processedAt: new Date(),
        ...(logId ? { logId } : {}),
      },
    });
  }

  async updateDeliveryStatus(
    organizationId: string,
    logId: string,
    status: EmailDeliveryStatusValue,
    occurredAt: Date,
  ): Promise<void> {
    const timestampFields: Partial<Record<EmailDeliveryStatusValue, string>> = {
      SENT: 'sentAt',
      DELIVERED: 'deliveredAt',
      OPENED: 'openedAt',
      CLICKED: 'clickedAt',
      BOUNCED: 'bouncedAt',
      COMPLAINED: 'complainedAt',
      FAILED: 'failedAt',
    };
    const timestampField = timestampFields[status];
    await this.prisma.emailLog.updateMany({
      where: { id: logId, organizationId },
      data: {
        status,
        ...(timestampField ? { [timestampField]: occurredAt } : {}),
      },
    });
  }

  async getPreference(
    organizationId: string,
    userId: string,
  ): Promise<EmailPreferenceRecord | null> {
    return this.prisma.emailPreference.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  async upsertPreference(
    organizationId: string,
    userId: string,
    data: Parameters<EmailRepository['upsertPreference']>[2],
  ): Promise<EmailPreferenceRecord> {
    return this.prisma.emailPreference.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      update: data,
      create: { organizationId, userId, ...data },
    });
  }

  async resolveTemplate(
    organizationId: string,
    key: string,
    locale: string,
  ): Promise<EmailTemplateRecord | null> {
    return this.prisma.emailTemplate.findFirst({
      where: {
        key,
        locale,
        status: 'ACTIVE',
        OR: [{ organizationId }, { organizationId: null, scopeKey: 'SYSTEM' }],
      },
      select: templateSelect,
      orderBy: [{ organizationId: 'desc' }, { version: 'desc' }],
    });
  }

  async listLogs(filters: EmailListFilters): Promise<{ items: EmailLogRecord[]; total: number }> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.search
        ? {
            OR: [
              { subject: { contains: filters.search, mode: 'insensitive' as const } },
              { templateKey: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailLog.findMany({
        where,
        select: logSelect,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.emailLog.count({ where }),
    ]);
    return { items, total };
  }

  async listQueue(
    filters: EmailListFilters,
  ): Promise<{ items: EmailQueueRecord[]; total: number }> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.search
        ? {
            OR: [
              { renderedSubject: { contains: filters.search, mode: 'insensitive' as const } },
              { templateKey: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailQueue.findMany({
        where,
        select: queueSelect,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.emailQueue.count({ where }),
    ]);
    return { items, total };
  }

  async listTemplates(organizationId: string, locale?: string): Promise<EmailTemplateRecord[]> {
    return this.prisma.emailTemplate.findMany({
      where: {
        status: 'ACTIVE',
        ...(locale ? { locale } : {}),
        OR: [{ organizationId }, { organizationId: null, scopeKey: 'SYSTEM' }],
      },
      select: templateSelect,
      orderBy: [{ key: 'asc' }, { organizationId: 'desc' }, { version: 'desc' }],
    });
  }

  async getStats(organizationId: string): Promise<EmailStats> {
    const statuses = ['SENT', 'DELIVERED', 'OPENED', 'BOUNCED', 'COMPLAINED', 'FAILED'] as const;
    const [total, ...counts] = await this.prisma.$transaction([
      this.prisma.emailLog.count({ where: { organizationId } }),
      ...statuses.map((status) =>
        this.prisma.emailLog.count({ where: { organizationId, status } }),
      ),
    ]);
    return {
      total,
      sent: counts[0] ?? 0,
      delivered: counts[1] ?? 0,
      opened: counts[2] ?? 0,
      bounced: counts[3] ?? 0,
      complained: counts[4] ?? 0,
      failed: counts[5] ?? 0,
    };
  }
}
