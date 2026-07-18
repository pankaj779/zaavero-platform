import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type {
  CreateBatchOptions,
  CreateEmailOptions,
  ErrorResponse,
  WebhookEventPayload,
} from 'resend';
import type { EnvConfig } from '../../../config/env.schema';
import { EMAIL_BATCH_MAX_SIZE } from '../constants/email.constants';
import {
  EmailBatchLimitExceededException,
  EmailBatchUnsupportedFieldException,
  EmailProviderNotConfiguredException,
  EmailProviderRejectedException,
  EmailProviderUnavailableException,
  EmailWebhookReplayedException,
  InvalidEmailRequestException,
  InvalidEmailWebhookException,
} from '../exceptions';
import type {
  EmailAttachmentInput,
  EmailProvider,
  EmailProviderStatus,
  EmailWebhookEvent,
  EmailWebhookRequest,
  SendBatchEmailRequest,
  SendBatchOptions,
  SendEmailRequest,
  SendEmailResult,
} from './email-provider.interface';

const CONFIGURATION_ERROR_CODES = new Set([
  'missing_api_key',
  'invalid_api_key',
  'restricted_api_key',
  'invalid_access',
]);

const TRANSIENT_ERROR_CODES = new Set([
  'rate_limit_exceeded',
  'daily_quota_exceeded',
  'monthly_quota_exceeded',
  'concurrent_idempotent_requests',
  'application_error',
  'internal_server_error',
]);

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'RESEND' as const;

  private readonly logger = new Logger(ResendEmailProvider.name);
  private client: Resend | null = null;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  isConfigured(): boolean {
    const apiKey = this.configService.get('RESEND_API_KEY', { infer: true });
    return Boolean(apiKey);
  }

  getStatus(): EmailProviderStatus {
    const webhookSecret = this.configService.get('RESEND_WEBHOOK_SECRET', { infer: true });
    return {
      provider: this.name,
      configured: this.isConfigured(),
      sandbox: false,
      webhookVerificationConfigured: Boolean(webhookSecret),
    };
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResult> {
    const payload = this.buildPayload(request, { allowAttachmentsAndSchedule: true });

    const result = await this.getClient().emails.send(
      payload,
      request.idempotencyKey ? { idempotencyKey: request.idempotencyKey } : undefined,
    );

    if (result.error) {
      throw this.mapProviderError(result.error, 'send');
    }

    return {
      providerMessageId: result.data.id,
      provider: this.name,
      status: request.scheduledAt ? 'SCHEDULED' : 'SENT',
    };
  }

  async sendBatch(
    requests: readonly SendBatchEmailRequest[],
    options?: SendBatchOptions,
  ): Promise<SendEmailResult[]> {
    if (requests.length === 0) {
      throw new InvalidEmailRequestException('A batch send requires at least one email.');
    }
    if (requests.length > EMAIL_BATCH_MAX_SIZE) {
      throw new EmailBatchLimitExceededException(
        `A batch send is limited to ${String(EMAIL_BATCH_MAX_SIZE)} emails per request; received ${String(requests.length)}.`,
      );
    }
    for (const request of requests) {
      if ('attachments' in request || 'scheduledAt' in request) {
        throw new EmailBatchUnsupportedFieldException();
      }
    }

    const payload: CreateBatchOptions = requests.map((request) =>
      this.buildPayload(request, { allowAttachmentsAndSchedule: false }),
    );

    const result = await this.getClient().batch.send(
      payload,
      options?.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined,
    );

    if (result.error) {
      throw this.mapProviderError(result.error, 'batch send');
    }

    return result.data.data.map((entry) => ({
      providerMessageId: entry.id,
      provider: this.name,
      status: 'SENT' as const,
    }));
  }

  verifyWebhook(request: EmailWebhookRequest): EmailWebhookEvent {
    const secret = this.configService.get('RESEND_WEBHOOK_SECRET', { infer: true });
    if (!secret) {
      throw new EmailProviderNotConfiguredException(
        'Email webhook verification is not configured. Set RESEND_WEBHOOK_SECRET.',
      );
    }
    if (!request.svixId || !request.svixTimestamp || !request.svixSignature) {
      throw new InvalidEmailWebhookException();
    }

    this.assertWithinReplayWindow(request.svixTimestamp);

    let event: WebhookEventPayload;
    try {
      event = this.getClient().webhooks.verify({
        payload: request.rawBody,
        headers: {
          id: request.svixId,
          timestamp: request.svixTimestamp,
          signature: request.svixSignature,
        },
        webhookSecret: secret,
      });
    } catch {
      throw new InvalidEmailWebhookException();
    }

    const data: Record<string, unknown> = { ...event.data };
    const providerMessageId = typeof data.email_id === 'string' ? data.email_id : null;

    return {
      id: request.svixId,
      type: event.type,
      createdAt: new Date(event.created_at),
      providerMessageId,
      data,
    };
  }

  private assertWithinReplayWindow(svixTimestamp: string): void {
    const timestampSeconds = Number(svixTimestamp);
    if (!Number.isFinite(timestampSeconds)) {
      throw new InvalidEmailWebhookException();
    }

    const toleranceSeconds = this.configService.get('EMAIL_WEBHOOK_TOLERANCE_SECONDS', {
      infer: true,
    });
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
      throw new EmailWebhookReplayedException();
    }
  }

  private buildPayload(
    request: SendBatchEmailRequest & Pick<SendEmailRequest, 'attachments' | 'scheduledAt'>,
    { allowAttachmentsAndSchedule }: { allowAttachmentsAndSchedule: boolean },
  ): CreateEmailOptions {
    if (!request.html && !request.text) {
      throw new InvalidEmailRequestException('An email requires an html or text body.');
    }

    const from = request.from ?? this.configService.get('EMAIL_FROM', { infer: true });
    const replyTo = request.replyTo ?? this.configService.get('EMAIL_REPLY_TO', { infer: true });

    const payload = {
      from,
      to: request.to,
      subject: request.subject,
      html: request.html,
      text: request.text,
      ...(replyTo ? { replyTo } : {}),
      ...(request.cc ? { cc: request.cc } : {}),
      ...(request.bcc ? { bcc: request.bcc } : {}),
      ...(request.headers ? { headers: request.headers } : {}),
      ...(request.tags ? { tags: request.tags } : {}),
      ...(allowAttachmentsAndSchedule && request.attachments?.length
        ? { attachments: request.attachments.map((attachment) => this.mapAttachment(attachment)) }
        : {}),
      ...(allowAttachmentsAndSchedule && request.scheduledAt
        ? { scheduledAt: request.scheduledAt.toISOString() }
        : {}),
    };

    return payload as CreateEmailOptions;
  }

  private mapAttachment(attachment: EmailAttachmentInput): {
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
    contentId?: string;
  } {
    const hasContent = attachment.content !== undefined;
    const hasPath = attachment.path !== undefined;
    if (hasContent === hasPath) {
      throw new InvalidEmailRequestException(
        'An attachment requires exactly one of inline content or a hosted path.',
      );
    }
    if (hasPath && !attachment.path?.startsWith('https://')) {
      throw new InvalidEmailRequestException(
        'Attachment paths must be HTTPS URLs of hosted files.',
      );
    }

    return {
      filename: attachment.filename,
      ...(hasContent ? { content: attachment.content } : {}),
      ...(hasPath ? { path: attachment.path } : {}),
      ...(attachment.contentType ? { contentType: attachment.contentType } : {}),
      ...(attachment.contentId ? { contentId: attachment.contentId } : {}),
    };
  }

  private mapProviderError(error: ErrorResponse | null, action: string): Error {
    const code = error?.name ?? 'unknown_error';
    // Never log or rethrow raw provider payloads; the code and message from
    // Resend error envelopes are safe and contain no credentials.
    this.logger.error(`Resend ${action} failed with code ${code}.`);

    if (CONFIGURATION_ERROR_CODES.has(code)) {
      return new EmailProviderNotConfiguredException(
        'The email provider rejected the configured credentials.',
      );
    }
    if (TRANSIENT_ERROR_CODES.has(code)) {
      return new EmailProviderUnavailableException(
        `The email provider is temporarily unavailable (${code}). Try again later.`,
      );
    }
    return new EmailProviderRejectedException(
      `The email provider rejected the ${action} request (${code}).`,
    );
  }

  private getClient(): Resend {
    if (!this.client) {
      const apiKey = this.configService.get('RESEND_API_KEY', { infer: true });
      if (!apiKey) {
        throw new EmailProviderNotConfiguredException(
          'Resend is not configured. Set RESEND_API_KEY or enable EMAIL_SANDBOX_MODE.',
        );
      }
      this.client = new Resend(apiKey);
    }
    return this.client;
  }
}
