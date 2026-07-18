import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { EMAIL_PROVIDER, EMAIL_REPOSITORY } from '../constants/injection-tokens';
import type { EmailQueueRecord, EmailRepository } from '../interfaces/email-repository.interface';
import type {
  EmailAttachmentInput,
  EmailProvider,
  EmailTag,
} from '../providers/email-provider.interface';

function safeError(error: unknown): { code: string; message: string } {
  if (typeof error !== 'object' || error === null) {
    return { code: 'UNKNOWN', message: 'Email delivery failed.' };
  }
  const candidate = error as { name?: unknown; message?: unknown };
  return {
    code: typeof candidate.name === 'string' ? candidate.name.slice(0, 100) : 'UNKNOWN',
    message:
      typeof candidate.message === 'string'
        ? candidate.message.slice(0, 500)
        : 'Email delivery failed.',
  };
}

function tags(value: unknown): EmailTag[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(
    (entry): entry is EmailTag =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as EmailTag).name === 'string' &&
      typeof (entry as EmailTag).value === 'string',
  );
}

function attachments(value: unknown): EmailAttachmentInput[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result = value.filter(
    (entry): entry is EmailAttachmentInput =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as EmailAttachmentInput).filename === 'string' &&
      typeof (entry as EmailAttachmentInput).path === 'string' &&
      Boolean((entry as EmailAttachmentInput).path?.startsWith('https://')),
  );
  return result.length ? result : undefined;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly repository: EmailRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly provider: EmailProvider,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async processBatch(workerId: string): Promise<number> {
    const batch = await this.repository.claimNextBatch(
      workerId,
      this.config.get('EMAIL_QUEUE_BATCH_SIZE', { infer: true }),
      new Date(),
    );
    await Promise.all(batch.map((item) => this.processOne(item)));
    return batch.length;
  }

  async recoverStuck(leaseMs = 5 * 60_000): Promise<number> {
    return this.repository.recoverStuckProcessing(new Date(Date.now() - leaseMs));
  }

  private async processOne(item: EmailQueueRecord): Promise<void> {
    try {
      if (!item.renderedSubject || (!item.renderedHtml && !item.renderedText)) {
        throw new Error('Queued email has no retry-safe rendered content.');
      }
      const result = await this.provider.sendEmail({
        to: item.to,
        cc: item.cc,
        bcc: item.bcc,
        from: item.fromAddress ?? undefined,
        replyTo: item.replyTo ?? undefined,
        subject: item.renderedSubject,
        html: item.renderedHtml ?? undefined,
        text: item.renderedText ?? undefined,
        headers: (item.headers ?? undefined) as Record<string, string> | undefined,
        tags: tags(item.tags),
        attachments: attachments(item.attachmentDescriptors),
        idempotencyKey: `${item.organizationId}:${item.idempotencyKey}`,
      });
      await this.repository.createLog({
        organizationId: item.organizationId,
        userId: item.userId ?? undefined,
        queueId: item.id,
        initiatedById: item.createdById ?? undefined,
        providerMessageId: result.providerMessageId,
        fromAddress: item.fromAddress ?? this.config.get('EMAIL_FROM', { infer: true }),
        replyTo: item.replyTo ?? undefined,
        to: item.to,
        cc: item.cc,
        bcc: item.bcc,
        subject: item.renderedSubject,
        templateKey: item.templateKey ?? undefined,
        templateVersion: item.templateVersion ?? undefined,
        category: item.category,
        status: 'SENT',
        attempts: item.attempts,
        metadata: { provider: result.provider, sandbox: result.status === 'SANDBOX' },
      });
      await this.repository.markSent(item.organizationId, item.id);
    } catch (error: unknown) {
      const safe = safeError(error);
      await this.repository.createLog({
        organizationId: item.organizationId,
        userId: item.userId ?? undefined,
        queueId: item.id,
        initiatedById: item.createdById ?? undefined,
        fromAddress: item.fromAddress ?? this.config.get('EMAIL_FROM', { infer: true }),
        replyTo: item.replyTo ?? undefined,
        to: item.to,
        cc: item.cc,
        bcc: item.bcc,
        subject: item.renderedSubject ?? '(unrendered email)',
        templateKey: item.templateKey ?? undefined,
        templateVersion: item.templateVersion ?? undefined,
        category: item.category,
        status: 'FAILED',
        attempts: item.attempts,
        errorCode: safe.code,
        errorMessage: safe.message,
      });
      if (item.attempts >= item.maxAttempts) {
        await this.repository.markDeadLetter(item.organizationId, item.id, safe.code, safe.message);
      } else {
        const backoffMs = item.backoffSeconds * 1000 * 2 ** Math.max(0, item.attempts - 1);
        await this.repository.markFailed(
          item.organizationId,
          item.id,
          safe.code,
          safe.message,
          new Date(Date.now() + backoffMs),
        );
      }
      this.logger.warn(`Email queue item ${item.id} failed with ${safe.code}.`);
    }
  }
}
