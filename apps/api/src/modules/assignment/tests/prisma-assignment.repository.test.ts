import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaAssignmentRepository } from '../repositories/prisma-assignment.repository';

describe('PrismaAssignmentRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const courseFindFirst = vi.fn();
  const batchFindFirst = vi.fn();
  const teacherFindFirst = vi.fn();

  let repository: PrismaAssignmentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaAssignmentRepository({
      assignment: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      course: {
        findFirst: courseFindFirst,
      },
      batch: {
        findFirst: batchFindFirst,
      },
      teacherProfile: {
        findFirst: teacherFindFirst,
      },
      $transaction: transaction,
    } as never);
  });

  it('lists assignments with filters, search, and pagination in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'assignment-1',
        organizationId: 'org-1',
        courseId: 'course-1',
        batchId: null,
        title: 'Essay',
        instructions: null,
        status: 'DRAFT',
        maxScore: 100,
        dueAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findMany({
      organizationId: 'org-1',
      courseId: 'course-1',
      status: 'DRAFT',
      search: 'essay',
      page: 2,
      limit: 10,
      sortBy: 'title',
      sortOrder: 'asc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deletedAt: null,
        courseId: 'course-1',
        status: 'DRAFT',
        title: {
          contains: 'essay',
          mode: 'insensitive',
        },
      },
      select: expect.any(Object) as object,
      orderBy: { title: 'asc' },
      skip: 10,
      take: 10,
    });
    expect(result.total).toBe(1);
  });

  it('soft-deletes by setting deletedAt', async () => {
    const deletedAt = new Date();
    update.mockResolvedValue({
      id: 'assignment-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      batchId: null,
      title: 'Essay',
      instructions: null,
      status: 'DRAFT',
      maxScore: null,
      dueAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt,
    });

    const result = await repository.softDelete('assignment-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'assignment-1' },
      data: { deletedAt: expect.any(Date) as Date },
      select: expect.any(Object) as object,
    });
    expect(result.deletedAt).toBe(deletedAt);
  });
});
