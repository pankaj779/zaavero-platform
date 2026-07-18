import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaAttendanceRepository } from '../repositories/prisma-attendance.repository';

describe('PrismaAttendanceRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const liveSessionFindFirst = vi.fn();
  const studentFindFirst = vi.fn();
  const teacherFindFirst = vi.fn();

  let repository: PrismaAttendanceRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaAttendanceRepository({
      attendance: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      liveSession: {
        findFirst: liveSessionFindFirst,
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

  it('lists attendances with filters and pagination in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'attendance-1',
        organizationId: 'org-1',
        liveSessionId: 'session-1',
        studentId: 'student-1',
        status: 'PRESENT',
        markedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findMany({
      organizationId: 'org-1',
      liveSessionId: 'session-1',
      studentId: 'student-1',
      status: 'PRESENT',
      page: 2,
      limit: 10,
      sortBy: 'markedAt',
      sortOrder: 'asc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        liveSessionId: 'session-1',
        studentId: 'student-1',
        status: 'PRESENT',
      },
      select: expect.any(Object) as object,
      orderBy: { markedAt: 'asc' },
      skip: 10,
      take: 10,
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('loads live session context with batch teacher id', async () => {
    liveSessionFindFirst.mockResolvedValue({
      id: 'session-1',
      organizationId: 'org-1',
      batchId: 'batch-1',
      batch: { teacherId: 'teacher-1' },
    });

    const result = await repository.findLiveSessionContext('session-1');

    expect(liveSessionFindFirst).toHaveBeenCalledWith({
      where: { id: 'session-1', deletedAt: null },
      select: {
        id: true,
        organizationId: true,
        batchId: true,
        batch: { select: { teacherId: true } },
      },
    });
    expect(result).toEqual({
      id: 'session-1',
      organizationId: 'org-1',
      batchId: 'batch-1',
      batchTeacherId: 'teacher-1',
    });
  });

  it('creates attendance with provided fields', async () => {
    create.mockResolvedValue({
      id: 'attendance-1',
      organizationId: 'org-1',
      liveSessionId: 'session-1',
      studentId: 'student-1',
      status: 'PRESENT',
      markedAt: new Date(),
      notes: 'On time',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await repository.create({
      organizationId: 'org-1',
      liveSessionId: 'session-1',
      studentId: 'student-1',
      status: 'PRESENT',
      markedAt: new Date(),
      notes: 'On time',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        liveSessionId: 'session-1',
        studentId: 'student-1',
        status: 'PRESENT',
        markedAt: expect.any(Date) as Date,
        notes: 'On time',
      },
      select: expect.any(Object) as object,
    });
    expect(result.status).toBe('PRESENT');
  });
});
