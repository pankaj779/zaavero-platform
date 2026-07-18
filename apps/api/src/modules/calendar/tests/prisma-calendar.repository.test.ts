import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaCalendarRepository } from '../repositories/prisma-calendar.repository';

describe('PrismaCalendarRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const courseFindFirst = vi.fn();
  const batchFindFirst = vi.fn();
  const liveSessionFindFirst = vi.fn();
  const assignmentFindFirst = vi.fn();
  const teacherFindFirst = vi.fn();

  let repository: PrismaCalendarRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaCalendarRepository({
      calendarEvent: {
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
      liveSession: {
        findFirst: liveSessionFindFirst,
      },
      assignment: {
        findFirst: assignmentFindFirst,
      },
      teacherProfile: {
        findFirst: teacherFindFirst,
      },
      $transaction: transaction,
    } as never);
  });

  it('lists calendar events with filters and date range in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'event-1',
        organizationId: 'org-1',
        courseId: null,
        batchId: null,
        liveSessionId: null,
        assignmentId: null,
        title: 'Office hours',
        description: null,
        startsAt: new Date('2026-02-01T10:00:00.000Z'),
        endsAt: new Date('2026-02-01T11:00:00.000Z'),
        allDay: false,
        externalProvider: 'NONE',
        externalEventId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    count.mockResolvedValue(1);

    const from = new Date('2026-02-01T00:00:00.000Z');
    const to = new Date('2026-02-28T23:59:59.999Z');

    const result = await repository.findMany({
      organizationId: 'org-1',
      courseId: 'course-1',
      batchId: 'batch-1',
      liveSessionId: 'session-1',
      assignmentId: 'assignment-1',
      from,
      to,
      search: 'office',
      page: 1,
      limit: 20,
      sortBy: 'startsAt',
      sortOrder: 'asc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deletedAt: null,
        courseId: 'course-1',
        batchId: 'batch-1',
        liveSessionId: 'session-1',
        assignmentId: 'assignment-1',
        startsAt: { gte: from, lte: to },
        title: { contains: 'office', mode: 'insensitive' },
      },
      select: expect.any(Object) as object,
      orderBy: { startsAt: 'asc' },
      skip: 0,
      take: 20,
    });
    expect(result.total).toBe(1);
  });

  it('soft-deletes calendar events by setting deletedAt', async () => {
    update.mockResolvedValue({
      id: 'event-1',
      organizationId: 'org-1',
      courseId: null,
      batchId: null,
      liveSessionId: null,
      assignmentId: null,
      title: 'Office hours',
      description: null,
      startsAt: new Date(),
      endsAt: null,
      allDay: false,
      externalProvider: 'NONE',
      externalEventId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    });

    const result = await repository.softDelete('event-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { deletedAt: expect.any(Date) as Date },
      select: expect.any(Object) as object,
    });
    expect(result.deletedAt).not.toBeNull();
  });
});
