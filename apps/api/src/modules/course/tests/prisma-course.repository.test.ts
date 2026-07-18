import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaCourseRepository } from '../repositories/prisma-course.repository';

describe('PrismaCourseRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();

  let repository: PrismaCourseRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaCourseRepository({
      course: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      teacherProfile: {
        findFirst,
      },
      $transaction: transaction,
    } as never);
  });

  it('lists courses with filters, pagination, and sorting in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'course-1',
        organizationId: 'org-1',
        teacherId: 'teacher-1',
        title: 'Sample',
        slug: 'sample',
        description: null,
        difficulty: 'BEGINNER',
        status: 'PUBLISHED',
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findMany({
      organizationId: 'org-1',
      search: 'sample',
      status: 'PUBLISHED',
      difficulty: 'BEGINNER',
      language: 'en',
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
        status: 'PUBLISHED',
        difficulty: 'BEGINNER',
        language: 'en',
        OR: [
          { title: { contains: 'sample', mode: 'insensitive' } },
          { description: { contains: 'sample', mode: 'insensitive' } },
        ],
      },
      select: expect.any(Object) as object,
      orderBy: { title: 'asc' },
      skip: 10,
      take: 10,
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('soft-deletes by setting deletedAt', async () => {
    const deletedAt = new Date('2026-01-03T00:00:00.000Z');
    update.mockResolvedValue({
      id: 'course-1',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
      title: 'Sample',
      slug: 'sample',
      description: null,
      difficulty: 'BEGINNER',
      status: 'DRAFT',
      language: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt,
    });

    const result = await repository.softDelete('course-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { deletedAt: expect.any(Date) as Date },
      select: expect.any(Object) as object,
    });
    expect(result.deletedAt).toEqual(deletedAt);
  });
});
