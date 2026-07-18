import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaEnrollmentRepository } from '../repositories/prisma-enrollment.repository';

describe('PrismaEnrollmentRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const batchFindFirst = vi.fn();
  const courseFindFirst = vi.fn();
  const studentFindFirst = vi.fn();
  const teacherFindFirst = vi.fn();

  let repository: PrismaEnrollmentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaEnrollmentRepository({
      enrollment: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      batch: {
        findFirst: batchFindFirst,
      },
      course: {
        findFirst: courseFindFirst,
      },
      studentProfile: {
        findFirst: studentFindFirst,
      },
      teacherProfile: {
        findFirst: teacherFindFirst,
      },
      $transaction: transaction,
    } as never);
  });

  it('lists enrollments with filters, search, and pagination in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'enrollment-1',
        organizationId: 'org-1',
        courseId: 'course-1',
        batchId: 'batch-1',
        studentId: 'student-1',
        status: 'ACTIVE',
        enrolledAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findMany({
      organizationId: 'org-1',
      batchId: 'batch-1',
      courseId: 'course-1',
      studentId: 'student-1',
      status: 'ACTIVE',
      search: 'ada',
      page: 2,
      limit: 10,
      sortBy: 'enrolledAt',
      sortOrder: 'asc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        batchId: 'batch-1',
        courseId: 'course-1',
        studentId: 'student-1',
        status: 'ACTIVE',
        student: {
          deletedAt: null,
          user: {
            OR: [
              { email: { contains: 'ada', mode: 'insensitive' } },
              { firstName: { contains: 'ada', mode: 'insensitive' } },
              { lastName: { contains: 'ada', mode: 'insensitive' } },
            ],
          },
        },
      },
      select: expect.any(Object) as object,
      orderBy: { enrolledAt: 'asc' },
      skip: 10,
      take: 10,
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('soft-deletes by setting status to DROPPED', async () => {
    update.mockResolvedValue({
      id: 'enrollment-1',
      organizationId: 'org-1',
      courseId: 'course-1',
      batchId: 'batch-1',
      studentId: 'student-1',
      status: 'DROPPED',
      enrolledAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await repository.softDelete('enrollment-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'enrollment-1' },
      data: { status: 'DROPPED', completedAt: null },
      select: expect.any(Object) as object,
    });
    expect(result.status).toBe('DROPPED');
  });
});
