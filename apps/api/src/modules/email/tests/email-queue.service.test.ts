/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import type { EmailQueueRecord, EmailRepository } from '../interfaces/email-repository.interface';
import type { EmailProvider } from '../providers/email-provider.interface';
import { EmailQueueService } from '../services/email-queue.service';

function queue(attempts: number, maxAttempts = 3): EmailQueueRecord {
  const now = new Date();
  return {
    id: 'queue-1',
    organizationId: 'org-1',
    userId: null,
    templateId: null,
    createdById: null,
    templateKey: null,
    templateVersion: null,
    variables: null,
    fromAddress: null,
    replyTo: null,
    to: ['person@example.com'],
    cc: [],
    bcc: [],
    renderedSubject: 'Subject',
    renderedHtml: '<p>Hello</p>',
    renderedText: 'Hello',
    headers: null,
    tags: null,
    attachmentDescriptors: null,
    category: 'SYSTEM',
    status: 'PROCESSING',
    priority: 0,
    scheduledAt: null,
    availableAt: now,
    lockedAt: now,
    lockedBy: 'worker',
    processedAt: null,
    attempts,
    maxAttempts,
    backoffSeconds: 60,
    lastErrorCode: null,
    lastErrorMessage: null,
    deadLetteredAt: null,
    cancelledAt: null,
    cancelReason: null,
    idempotencyKey: 'abcdefgh',
    metadata: null,
    createdAt: now,
    updatedAt: now,
  };
}

function setup(item: EmailQueueRecord) {
  const repository = {
    claimNextBatch: vi.fn().mockResolvedValue([item]),
    createLog: vi.fn().mockResolvedValue({}),
    markFailed: vi.fn().mockResolvedValue(undefined),
    markDeadLetter: vi.fn().mockResolvedValue(undefined),
  } as unknown as EmailRepository;
  const provider = {
    sendEmail: vi.fn().mockRejectedValue(new Error('temporary provider failure')),
  } as unknown as EmailProvider;
  const config = {
    get: vi.fn((key: string) => (key === 'EMAIL_QUEUE_BATCH_SIZE' ? 20 : 'from@example.com')),
  } as unknown as ConfigService<EnvConfig, true>;
  return { repository, service: new EmailQueueService(repository, provider, config) };
}

describe('EmailQueueService', () => {
  it('requeues failures with exponential backoff before max attempts', async () => {
    const { repository, service } = setup(queue(2));
    await service.processBatch('worker');
    expect(repository.markFailed).toHaveBeenCalledOnce();
    const availableAt = vi.mocked(repository.markFailed).mock.calls[0]?.[4];
    expect(availableAt?.getTime()).toBeGreaterThan(Date.now() + 100_000);
    expect(repository.markDeadLetter).not.toHaveBeenCalled();
  });

  it('dead-letters after max attempts', async () => {
    const { repository, service } = setup(queue(3));
    await service.processBatch('worker');
    expect(repository.markDeadLetter).toHaveBeenCalledOnce();
    expect(repository.markFailed).not.toHaveBeenCalled();
  });
});
