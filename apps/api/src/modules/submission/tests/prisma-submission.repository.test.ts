import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaSubmissionRepository } from '../repositories/prisma-submission.repository';

describe('PrismaSubmissionRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const assignmentFindFirst = vi.fn();
  const courseFindFirst = vi.fn();
  const studentFindFirst = vi.fn();
  const teacherFindFirst = vi.fn();

  let repository: PrismaSubmissionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaSubmissionRepository({
      assignmentSubmission: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      assignment: {
        findFirst: assignmentFindFirst,
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

  it('lists submissions with filters and pagination in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'submission-1',
        organizationId: 'org-1',
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        status: 'SUBMITTED',
        content: 'Answer',
        attachments: [],
        score: null,
        feedback: null,
        submittedAt: new Date(),
        gradedAt: null,
        gradedById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findMany({
      organizationId: 'org-1',
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      status: 'SUBMITTED',
      page: 1,
      limit: 10,
      sortBy: 'submittedAt',
      sortOrder: 'desc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        status: 'SUBMITTED',
      },
      select: expect.any(Object) as object,
      orderBy: { submittedAt: 'desc' },
      skip: 0,
      take: 10,
    });
    expect(result.total).toBe(1);
  });
});
