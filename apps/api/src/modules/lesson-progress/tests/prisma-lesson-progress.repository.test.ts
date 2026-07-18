import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaLessonProgressRepository } from '../repositories/prisma-lesson-progress.repository';

describe('PrismaLessonProgressRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const prisma = {
    lessonProgress: { findFirst, findMany, count, create, update },
    lesson: { findFirst },
    studentProfile: { findFirst },
    $transaction: transaction,
  };
  let repository: PrismaLessonProgressRepository;
  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaLessonProgressRepository(prisma as never);
  });
  it('paginates findMany', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    transaction.mockImplementation(async (ops: unknown[]) =>
      Promise.all(ops as Promise<unknown>[]),
    );
    await repository.findMany({
      organizationId: 'org-1',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
  });
  it('creates with select', async () => {
    create.mockResolvedValue({ id: '1' });
    await repository.create({ organizationId: 'org-1', lessonId: 'l1', studentId: 's1' });
    expect(create).toHaveBeenCalled();
  });
});
