import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaLiveSessionRepository } from '../repositories/prisma-live-session.repository';

describe('PrismaLiveSessionRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const prisma = {
    liveSession: { findFirst, findMany, count, create, update },
    batch: { findFirst },
    teacherProfile: { findFirst },
    $transaction: transaction,
  };
  let repository: PrismaLiveSessionRepository;
  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaLiveSessionRepository(prisma as never);
  });

  it('findMany soft-delete filters', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    transaction.mockImplementation(async (ops: unknown[]) =>
      Promise.all(ops as Promise<unknown>[]),
    );
    await repository.findMany({
      organizationId: 'org-1',
      page: 1,
      limit: 20,
      sortBy: 'startsAt',
      sortOrder: 'asc',
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }) as object,
      }) as object,
    );
  });

  it('softDelete sets deletedAt', async () => {
    update.mockResolvedValue(rowLike());
    await repository.softDelete('ls-1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date) as Date }) as object,
      }) as object,
    );
  });
});

function rowLike() {
  return {
    id: 'ls-1',
    organizationId: 'org-1',
    batchId: 'b1',
    title: 't',
    description: null,
    status: 'SCHEDULED',
    meetingProvider: 'NONE',
    meetingUrl: null,
    recordingUrl: null,
    startsAt: new Date(),
    endsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
