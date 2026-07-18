export type EmailProviderName = 'RESEND' | 'SANDBOX';

/**
 * Delivery status reported by a provider immediately after accepting a message.
 * SANDBOX explicitly marks messages that were captured locally and NOT delivered.
 */
export type EmailDeliveryStatus = 'SENT' | 'SCHEDULED' | 'SANDBOX';

export interface EmailTag {
  name: string;
  value: string;
}

export interface EmailAttachmentInput {
  filename: string;
  /** Inline attachment content (base64 string, UTF-8 string, or raw buffer). */
  content?: string | Buffer;
  /** HTTPS URL of a hosted attachment. Local filesystem paths are rejected. */
  path?: string;
  contentType?: string;
  /** Content ID for inline attachments referenced via `cid:` in the HTML body. */
  contentId?: string;
}

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  /** Overrides the configured EMAIL_FROM default. */
  from?: string;
  /** Overrides the configured EMAIL_REPLY_TO default. */
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
  tags?: EmailTag[];
  attachments?: EmailAttachmentInput[];
  /** Schedule delivery for a future time, where the provider supports it. */
  scheduledAt?: Date;
  /** Provider idempotency key for safe retries of the same logical send. */
  idempotencyKey?: string;
}

/**
 * Batch sends do not support attachments or scheduling (Resend batch API
 * limitation); the idempotency key applies to the whole batch instead.
 */
export type SendBatchEmailRequest = Omit<
  SendEmailRequest,
  'attachments' | 'scheduledAt' | 'idempotencyKey'
>;

export interface SendBatchOptions {
  /** Provider idempotency key covering the entire batch. */
  idempotencyKey?: string;
}

export interface SendEmailResult {
  providerMessageId: string;
  provider: EmailProviderName;
  status: EmailDeliveryStatus;
}

export interface EmailProviderStatus {
  provider: EmailProviderName;
  configured: boolean;
  sandbox: boolean;
  webhookVerificationConfigured: boolean;
}

export interface EmailWebhookRequest {
  /** Raw, untouched request body string exactly as received on the wire. */
  rawBody: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
}

/** Normalized provider webhook event envelope. */
export interface EmailWebhookEvent {
  /** Unique webhook delivery id (svix message id) for de-duplication. */
  id: string;
  /** Provider event type, e.g. `email.delivered`. */
  type: string;
  createdAt: Date;
  /** Provider message id the event refers to, when applicable. */
  providerMessageId: string | null;
  data: Record<string, unknown>;
}

/**
 * Provider-agnostic email delivery contract. Implementations exist for Resend
 * and the local sandbox; SES/SendGrid/Mailgun/Postmark can be added without
 * touching business logic.
 */
export interface EmailProvider {
  readonly name: EmailProviderName;
  isConfigured(): boolean;
  getStatus(): EmailProviderStatus;
  sendEmail(request: SendEmailRequest): Promise<SendEmailResult>;
  sendBatch(
    requests: readonly SendBatchEmailRequest[],
    options?: SendBatchOptions,
  ): Promise<SendEmailResult[]>;
  /** Verifies a provider webhook (signature + replay window) and normalizes it. */
  verifyWebhook(request: EmailWebhookRequest): EmailWebhookEvent;
}
