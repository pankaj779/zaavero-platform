import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaBatchRepository } from '../repositories/prisma-batch.repository';

describe('PrismaBatchRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const courseFindFirst = vi.fn();
  const teacherFindFirst = vi.fn();

  let repository: PrismaBatchRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaBatchRepository({
      batch: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      course: {
        findFirst: courseFindFirst,
      },
      teacherProfile: {
        findFirst: teacherFindFirst,
      },
      $transaction: transaction,
    } as never);
  });

  it('lists batches with filters, pagination, and sorting in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'batch-1',
        organizationId: 'org-1',
        courseId: 'course-1',
        teacherId: 'teacher-1',
        name: 'Sample',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: null,
        maxStudents: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findMany({
      organizationId: 'org-1',
      search: 'sample',
      status: 'ACTIVE',
      courseId: 'course-1',
      teacherId: 'teacher-1',
      page: 2,
      limit: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deletedAt: null,
        status: 'ACTIVE',
        courseId: 'course-1',
        teacherId: 'teacher-1',
        name: { contains: 'sample', mode: 'insensitive' },
      },
      select: expect.any(Object) as object,
      orderBy: { name: 'asc' },
      skip: 10,
      take: 10,
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('soft-deletes by setting deletedAt', async () => {
    const deletedAt = new Date('2026-01-03T00:00:00.000Z');
    update.mockResolvedValue({
      id: 'batch-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
      name: 'Sample',
      status: 'UPCOMING',
      startDate: new Date(),
      endDate: null,
      maxStudents: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt,
    });

    const result = await repository.softDelete('batch-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
      data: { deletedAt: expect.any(Date) as Date },
      select: expect.any(Object) as object,
    });
    expect(result.deletedAt).toEqual(deletedAt);
  });
});
