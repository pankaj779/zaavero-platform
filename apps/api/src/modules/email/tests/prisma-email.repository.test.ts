/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@graphology/database';
import type { EnqueueEmailData } from '../interfaces/email-repository.interface';
import { PrismaEmailRepository } from '../repositories/prisma-email.repository';

const enqueue: EnqueueEmailData = {
  organizationId: 'org-1',
  to: ['person@example.com'],
  renderedSubject: 'Subject',
  renderedText: 'Body',
  category: 'SYSTEM',
  maxAttempts: 5,
  idempotencyKey: 'idempotent-key',
};

describe('PrismaEmailRepository', () => {
  it('returns the existing organization-scoped row on idempotency conflict', async () => {
    const prisma = {
      emailQueue: {
        create: vi.fn().mockRejectedValue({ code: 'P2002' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'existing-queue' }),
      },
    } as unknown as PrismaClient;
    const result = await new PrismaEmailRepository(prisma).enqueue(enqueue);
    expect(result.created).toBe(false);
    expect(result.queue.id).toBe('existing-queue');
    expect(prisma.emailQueue.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_idempotencyKey: {
            organizationId: 'org-1',
            idempotencyKey: 'idempotent-key',
          },
        },
      }),
    );
  });

  it('claims with FOR UPDATE SKIP LOCKED before marking processing', async () => {
    const tx = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ id: 'queue-1' }]),
      emailQueue: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaClient;
    await new PrismaEmailRepository(prisma).claimNextBatch('worker-1', 10, new Date());
    expect(tx.$queryRawUnsafe.mock.calls[0]?.[0]).toContain('FOR UPDATE SKIP LOCKED');
    expect(tx.emailQueue.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PROCESSING', lockedBy: 'worker-1' }),
      }),
    );
  });
});
