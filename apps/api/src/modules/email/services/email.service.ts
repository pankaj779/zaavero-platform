import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { EMAIL_REPOSITORY } from '../constants/injection-tokens';
import type {
  EmailAttachmentMetadataInput,
  EmailCategoryValue,
  EmailRepository,
} from '../interfaces/email-repository.interface';
import { EmailPreferenceService } from './email-preference.service';
import { EmailTemplateService } from './email-template.service';

interface CommonEnqueueInput {
  organizationId: string;
  userId?: string;
  createdById?: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  from?: string;
  replyTo?: string;
  category?: EmailCategoryValue;
  priority?: number;
  scheduledAt?: Date;
  idempotencyKey: string;
  correlationId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  attachments?: EmailAttachmentMetadataInput[];
}

export interface EnqueueTemplateEmailInput extends CommonEnqueueInput {
  templateKey: string;
  locale?: string;
  variables: Record<string, unknown>;
}

export interface EnqueueRawEmailInput extends CommonEnqueueInput {
  subject: string;
  html?: string;
  text?: string;
}

export interface EnqueueEmailResult {
  queueId: string | null;
  logId: string | null;
  duplicate: boolean;
  suppressed: boolean;
}

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly repository: EmailRepository,
    private readonly templates: EmailTemplateService,
    private readonly preferences: EmailPreferenceService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async enqueueTemplateEmail(input: EnqueueTemplateEmailInput): Promise<EnqueueEmailResult> {
    this.assertIdempotencyKey(input.idempotencyKey);
    const rendered = await this.templates.render(
      input.organizationId,
      input.templateKey,
      input.variables,
      input.locale,
    );
    const category = input.category ?? rendered.template.category;
    if (!(await this.preferences.isEnabled(input.organizationId, input.userId, category))) {
      return { queueId: null, logId: null, duplicate: false, suppressed: true };
    }
    const result = await this.repository.enqueue({
      ...this.commonData(input, category),
      templateId: rendered.template.id,
      templateKey: rendered.template.key,
      templateVersion: rendered.template.version,
      variables: input.variables,
      renderedSubject: rendered.subject,
      renderedHtml: rendered.html,
      renderedText: rendered.text,
    });
    await this.persistAttachments(input, result.created, result.queue.id);
    return {
      queueId: result.queue.id,
      logId: null,
      duplicate: !result.created,
      suppressed: false,
    };
  }

  async enqueueRawEmail(input: EnqueueRawEmailInput): Promise<EnqueueEmailResult> {
    this.assertIdempotencyKey(input.idempotencyKey);
    if (!input.html && !input.text) {
      throw new BadRequestException('A raw email requires an HTML or text body.');
    }
    const category = input.category ?? 'SYSTEM';
    if (!(await this.preferences.isEnabled(input.organizationId, input.userId, category))) {
      return { queueId: null, logId: null, duplicate: false, suppressed: true };
    }
    const result = await this.repository.enqueue({
      ...this.commonData(input, category),
      renderedSubject: input.subject,
      renderedHtml: input.html,
      renderedText: input.text,
    });
    await this.persistAttachments(input, result.created, result.queue.id);
    return {
      queueId: result.queue.id,
      logId: null,
      duplicate: !result.created,
      suppressed: false,
    };
  }

  cancel(organizationId: string, queueId: string, reason?: string): Promise<boolean> {
    return this.repository.cancel(organizationId, queueId, reason);
  }

  retryDeadLetter(organizationId: string, queueId: string): Promise<boolean> {
    return this.repository.retryDeadLetter(organizationId, queueId);
  }

  private commonData(input: CommonEnqueueInput, category: EmailCategoryValue) {
    return {
      organizationId: input.organizationId,
      userId: input.userId,
      createdById: input.createdById,
      to: Array.isArray(input.to) ? input.to : [input.to],
      cc: input.cc,
      bcc: input.bcc,
      fromAddress: input.from,
      replyTo: input.replyTo,
      category,
      priority: input.priority,
      scheduledAt: input.scheduledAt,
      maxAttempts: this.config.get('EMAIL_MAX_ATTEMPTS', { infer: true }),
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
      attachmentDescriptors: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        path: attachment.url,
        contentType: attachment.contentType,
        contentId: attachment.contentId,
      })),
    };
  }

  private async persistAttachments(
    input: CommonEnqueueInput,
    created: boolean,
    queueId: string,
  ): Promise<void> {
    if (created && input.attachments?.length) {
      await this.repository.createAttachmentMetadata(
        input.organizationId,
        queueId,
        input.attachments,
      );
    }
  }

  private assertIdempotencyKey(key: string): void {
    if (!key || key.trim().length < 8 || key.length > 128) {
      throw new BadRequestException('An idempotency key between 8 and 128 characters is required.');
    }
  }
}
