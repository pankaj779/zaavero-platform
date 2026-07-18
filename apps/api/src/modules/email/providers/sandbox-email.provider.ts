import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { EMAIL_BATCH_MAX_SIZE, SANDBOX_MESSAGE_ID_PREFIX } from '../constants/email.constants';
import {
  EmailBatchLimitExceededException,
  EmailBatchUnsupportedFieldException,
  EmailWebhookReplayedException,
  InvalidEmailRequestException,
  InvalidEmailWebhookException,
} from '../exceptions';
import type {
  EmailProvider,
  EmailProviderStatus,
  EmailWebhookEvent,
  EmailWebhookRequest,
  SendBatchEmailRequest,
  SendEmailRequest,
  SendEmailResult,
} from './email-provider.interface';

/**
 * Local development/test provider. Never performs network calls and never
 * delivers anything; every result is explicitly reported with status SANDBOX
 * so callers cannot mistake it for real delivery.
 */
@Injectable()
export class SandboxEmailProvider implements EmailProvider {
  readonly name = 'SANDBOX' as const;

  private readonly logger = new Logger(SandboxEmailProvider.name);
  private sequence = 0;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  isConfigured(): boolean {
    return true;
  }

  getStatus(): EmailProviderStatus {
    return {
      provider: this.name,
      configured: true,
      sandbox: true,
      webhookVerificationConfigured: false,
    };
  }

  sendEmail(request: SendEmailRequest): Promise<SendEmailResult> {
    // Throwing inside the executor turns validation errors into rejections,
    // matching the async contract of real providers.
    return new Promise((resolve) => {
      this.assertHasBody(request);
      resolve(this.capture(request));
    });
  }

  sendBatch(requests: readonly SendBatchEmailRequest[]): Promise<SendEmailResult[]> {
    return new Promise((resolve) => {
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
        this.assertHasBody(request);
      }

      resolve(requests.map((request) => this.capture(request)));
    });
  }

  /**
   * Sandbox webhooks are not signed; the payload is parsed and the replay
   * window is still enforced so integration code paths behave consistently.
   */
  verifyWebhook(request: EmailWebhookRequest): EmailWebhookEvent {
    this.assertWithinReplayWindow(request.svixTimestamp);

    let parsed: unknown;
    try {
      parsed = JSON.parse(request.rawBody);
    } catch {
      throw new InvalidEmailWebhookException('The sandbox webhook payload is not valid JSON.');
    }
    if (parsed === null || typeof parsed !== 'object') {
      throw new InvalidEmailWebhookException('The sandbox webhook payload is not an object.');
    }

    const body = parsed as Record<string, unknown>;
    const type = typeof body.type === 'string' ? body.type : 'sandbox.event';
    const createdAt = typeof body.created_at === 'string' ? new Date(body.created_at) : new Date();
    const data =
      body.data !== null && typeof body.data === 'object'
        ? ({ ...body.data } as Record<string, unknown>)
        : {};
    const providerMessageId = typeof data.email_id === 'string' ? data.email_id : null;

    return {
      id: request.svixId || `${SANDBOX_MESSAGE_ID_PREFIX}webhook_${this.hash(request.rawBody)}`,
      type,
      createdAt,
      providerMessageId,
      data,
    };
  }

  private capture(request: SendBatchEmailRequest): SendEmailResult {
    this.sequence += 1;
    const recipients = Array.isArray(request.to) ? request.to : [request.to];
    const providerMessageId = `${SANDBOX_MESSAGE_ID_PREFIX}${this.hash(
      `${recipients.join(',')}|${request.subject}`,
    )}_${String(this.sequence)}`;

    this.logger.log(
      `SANDBOX email captured (not delivered): id=${providerMessageId} to=${recipients.join(', ')} subject="${request.subject}"`,
    );

    return {
      providerMessageId,
      provider: this.name,
      status: 'SANDBOX',
    };
  }

  private assertHasBody(request: SendBatchEmailRequest): void {
    if (!request.html && !request.text) {
      throw new InvalidEmailRequestException('An email requires an html or text body.');
    }
  }

  private assertWithinReplayWindow(svixTimestamp: string): void {
    const timestampSeconds = Number(svixTimestamp);
    if (!svixTimestamp || !Number.isFinite(timestampSeconds)) {
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

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
  }
}
