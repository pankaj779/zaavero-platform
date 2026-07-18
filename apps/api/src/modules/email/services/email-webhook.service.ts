import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_PROVIDER, EMAIL_REPOSITORY } from '../constants/injection-tokens';
import type {
  EmailDeliveryStatusValue,
  EmailEventTypeValue,
  EmailRepository,
} from '../interfaces/email-repository.interface';
import type { EmailProvider, EmailWebhookRequest } from '../providers/email-provider.interface';

const eventMap: Record<string, { type: EmailEventTypeValue; status?: EmailDeliveryStatusValue }> = {
  'email.sent': { type: 'SENT', status: 'SENT' },
  'email.delivered': { type: 'DELIVERED', status: 'DELIVERED' },
  'email.opened': { type: 'OPENED', status: 'OPENED' },
  'email.clicked': { type: 'CLICKED', status: 'CLICKED' },
  'email.bounced': { type: 'BOUNCED', status: 'BOUNCED' },
  'email.complained': { type: 'COMPLAINED', status: 'COMPLAINED' },
  'email.delivery_delayed': { type: 'OTHER' },
  'email.failed': { type: 'FAILED', status: 'FAILED' },
};

const progress: Partial<Record<EmailDeliveryStatusValue, number>> = {
  QUEUED: 0,
  SENDING: 1,
  SENT: 2,
  DELIVERED: 3,
  OPENED: 4,
  CLICKED: 5,
};

function shouldTransition(
  current: EmailDeliveryStatusValue,
  next: EmailDeliveryStatusValue,
): boolean {
  if (['BOUNCED', 'COMPLAINED', 'FAILED'].includes(next)) return true;
  if (['BOUNCED', 'COMPLAINED', 'FAILED', 'CANCELLED'].includes(current)) return false;
  return (progress[next] ?? 0) >= (progress[current] ?? 0);
}

function sanitizePayload(data: Record<string, unknown>): Record<string, unknown> {
  const sensitive = new Set(['to', 'from', 'cc', 'bcc', 'email', 'subject', 'html', 'text']);
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      sensitive.has(key.toLowerCase()) ? '[REDACTED]' : value,
    ]),
  );
}

@Injectable()
export class EmailWebhookService {
  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly provider: EmailProvider,
    @Inject(EMAIL_REPOSITORY)
    private readonly repository: EmailRepository,
  ) {}

  async handle(request: EmailWebhookRequest): Promise<{ duplicate: boolean; processed: boolean }> {
    const event = this.provider.verifyWebhook(request);
    const mapping = eventMap[event.type] ?? { type: 'OTHER' as const };
    if (!event.providerMessageId) {
      return { duplicate: false, processed: false };
    }
    const log = await this.repository.findLogByProviderMessageId('RESEND', event.providerMessageId);
    if (!log) {
      // EmailEvent requires a tenant. Unknown provider messages are acknowledged
      // but cannot safely be assigned to an organization.
      return { duplicate: false, processed: false };
    }
    const stored = await this.repository.createEvent({
      organizationId: log.organizationId,
      logId: log.id,
      provider: 'RESEND',
      eventId: event.id,
      providerMessageId: event.providerMessageId,
      type: mapping.type,
      occurredAt: event.createdAt,
      payload: sanitizePayload(event.data),
      signatureHash: createHash('sha256').update(request.svixSignature).digest('hex'),
    });
    if (!stored.created) {
      return { duplicate: true, processed: true };
    }
    if (mapping.status && shouldTransition(log.status, mapping.status)) {
      await this.repository.updateDeliveryStatus(
        log.organizationId,
        log.id,
        mapping.status,
        event.createdAt,
      );
    }
    await this.repository.processEvent(stored.id, log.id);
    return { duplicate: false, processed: true };
  }
}
