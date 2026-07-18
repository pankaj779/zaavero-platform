import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaLessonRepository } from '../repositories/prisma-lesson.repository';

describe('PrismaLessonRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();

  const prisma = {
    lesson: { findFirst, findMany, count, create, update },
    courseModule: { findFirst },
    course: { findFirst },
    teacherProfile: { findFirst },
    $transaction: transaction,
  };

  let repository: PrismaLessonRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaLessonRepository(prisma as never);
  });

  it('findMany excludes soft-deleted rows and paginates', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    transaction.mockImplementation(async (ops: unknown[]) =>
      Promise.all(ops as Promise<unknown>[]),
    );

    await repository.findMany({
      organizationId: 'org-1',
      page: 2,
      limit: 10,
      sortBy: 'displayOrder',
      sortOrder: 'asc',
    });

    expect(transaction).toHaveBeenCalled();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1', deletedAt: null }) as object,
        skip: 10,
        take: 10,
      }) as object,
    );
  });

  it('softDelete sets deletedAt', async () => {
    update.mockResolvedValue({
      id: 'lesson-1',
      organizationId: 'org-1',
      moduleId: 'module-1',
      title: 'Welcome',
      description: null,
      contentType: 'VIDEO',
      contentUrl: null,
      durationSeconds: null,
      displayOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await repository.softDelete('lesson-1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lesson-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) as Date }) as object,
      }) as object,
    );
  });
});
