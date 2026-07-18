/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from 'vitest';
import { InvalidEmailWebhookException } from '../exceptions';
import type { EmailLogRecord, EmailRepository } from '../interfaces/email-repository.interface';
import type { EmailProvider } from '../providers/email-provider.interface';
import { EmailWebhookService } from '../services/email-webhook.service';

const request = {
  rawBody: '{}',
  svixId: 'event-1',
  svixTimestamp: '1',
  svixSignature: 'signature',
};

function log(status: EmailLogRecord['status'] = 'SENT'): EmailLogRecord {
  const now = new Date();
  return {
    id: 'log-1',
    organizationId: 'org-1',
    queueId: 'queue-1',
    providerMessageId: 'message-1',
    to: ['person@example.com'],
    subject: 'Subject',
    templateKey: null,
    category: 'SYSTEM',
    status,
    attempts: 1,
    sentAt: now,
    deliveredAt: null,
    openedAt: null,
    clickedAt: null,
    bouncedAt: null,
    complainedAt: null,
    failedAt: null,
    errorCode: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
}

function provider(type = 'email.delivered') {
  return {
    verifyWebhook: vi.fn().mockReturnValue({
      id: 'event-1',
      type,
      createdAt: new Date(),
      providerMessageId: 'message-1',
      data: { email_id: 'message-1', to: ['person@example.com'] },
    }),
  } as unknown as EmailProvider;
}

describe('EmailWebhookService', () => {
  it('rejects invalid signatures through provider verification', async () => {
    const emailProvider = {
      verifyWebhook: vi.fn(() => {
        throw new InvalidEmailWebhookException();
      }),
    } as unknown as EmailProvider;
    const service = new EmailWebhookService(emailProvider, {} as EmailRepository);
    await expect(service.handle(request)).rejects.toBeInstanceOf(InvalidEmailWebhookException);
  });

  it('deduplicates provider events', async () => {
    const repository = {
      findLogByProviderMessageId: vi.fn().mockResolvedValue(log()),
      createEvent: vi.fn().mockResolvedValue({ created: false, id: 'stored-1' }),
      updateDeliveryStatus: vi.fn(),
      processEvent: vi.fn(),
    } as unknown as EmailRepository;
    const result = await new EmailWebhookService(provider(), repository).handle(request);
    expect(result).toEqual({ duplicate: true, processed: true });
    expect(repository.updateDeliveryStatus).not.toHaveBeenCalled();
  });

  it('updates status and prevents a late delivered event regressing OPENED', async () => {
    const repository = {
      findLogByProviderMessageId: vi.fn().mockResolvedValue(log('OPENED')),
      createEvent: vi.fn().mockResolvedValue({ created: true, id: 'stored-1' }),
      updateDeliveryStatus: vi.fn(),
      processEvent: vi.fn(),
    } as unknown as EmailRepository;
    await new EmailWebhookService(provider('email.delivered'), repository).handle(request);
    expect(repository.updateDeliveryStatus).not.toHaveBeenCalled();
    expect(repository.processEvent).toHaveBeenCalledWith('stored-1', 'log-1');
  });
});
