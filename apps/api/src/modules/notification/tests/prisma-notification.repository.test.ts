import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaNotificationRepository } from '../repositories/prisma-notification.repository';

describe('PrismaNotificationRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const updateMany = vi.fn();
  const transaction = vi.fn();
  const organizationMemberFindFirst = vi.fn();

  let repository: PrismaNotificationRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaNotificationRepository({
      notification: {
        findFirst,
        findMany,
        count,
        create,
        update,
        updateMany,
      },
      organizationMember: {
        findFirst: organizationMemberFindFirst,
      },
      $transaction: transaction,
    } as never);
  });

  it('lists notifications with filters and pagination in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'notification-1',
        organizationId: 'org-1',
        userId: 'user-1',
        channel: 'IN_APP',
        type: 'assignment.due',
        title: 'Due soon',
        body: null,
        data: null,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findMany({
      organizationId: 'org-1',
      userId: 'user-1',
      channel: 'IN_APP',
      type: 'assignment.due',
      unreadOnly: true,
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        userId: 'user-1',
        channel: 'IN_APP',
        type: 'assignment.due',
        readAt: null,
      },
      select: expect.any(Object) as object,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(result.total).toBe(1);
  });

  it('updates read state by setting or clearing readAt', async () => {
    update.mockResolvedValue({
      id: 'notification-1',
      organizationId: 'org-1',
      userId: 'user-1',
      channel: 'IN_APP',
      type: 'assignment.due',
      title: 'Due soon',
      body: null,
      data: null,
      readAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await repository.updateReadState('notification-1', true);

    expect(update).toHaveBeenCalledWith({
      where: { id: 'notification-1' },
      data: { readAt: expect.any(Date) as Date },
      select: expect.any(Object) as object,
    });
    expect(result.readAt).not.toBeNull();
  });

  it('marks all unread notifications as read for a user', async () => {
    updateMany.mockResolvedValue({ count: 2 });

    const count = await repository.markAllRead('org-1', 'user-1');

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        userId: 'user-1',
        readAt: null,
      },
      data: { readAt: expect.any(Date) as Date },
    });
    expect(count).toBe(2);
  });
});
