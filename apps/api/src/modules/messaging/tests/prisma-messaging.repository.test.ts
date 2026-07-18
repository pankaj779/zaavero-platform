import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaMessagingRepository } from '../repositories/prisma-messaging.repository';

describe('PrismaMessagingRepository', () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const count = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const transaction = vi.fn();
  const organizationMemberFindFirst = vi.fn();

  let repository: PrismaMessagingRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    repository = new PrismaMessagingRepository({
      conversation: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      conversationParticipant: {
        findFirst,
        create,
      },
      message: {
        findFirst,
        findMany,
        count,
        create,
        update,
      },
      organizationMember: {
        findFirst: organizationMemberFindFirst,
      },
      $transaction: transaction,
    } as never);
  });

  it('lists conversations with participant and search filters in a transaction', async () => {
    findMany.mockResolvedValue([
      {
        id: 'conversation-1',
        organizationId: 'org-1',
        type: 'DIRECT',
        title: 'Help',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
      },
    ]);
    count.mockResolvedValue(1);

    const result = await repository.findConversations({
      organizationId: 'org-1',
      participantUserId: 'user-1',
      type: 'DIRECT',
      search: 'help',
      page: 1,
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        type: 'DIRECT',
        participants: { some: { userId: 'user-1' } },
        title: { contains: 'help', mode: 'insensitive' },
      },
      select: expect.any(Object) as object,
      orderBy: { updatedAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(result.total).toBe(1);
  });

  it('soft-deletes messages by setting deletedAt', async () => {
    update.mockResolvedValue({
      id: 'message-1',
      organizationId: 'org-1',
      conversationId: 'conversation-1',
      senderId: 'user-1',
      body: 'Hello',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    });

    const result = await repository.softDeleteMessage('message-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'message-1' },
      data: { deletedAt: expect.any(Date) as Date },
      select: expect.any(Object) as object,
    });
    expect(result.deletedAt).not.toBeNull();
  });

  it('checks organization membership for active users', async () => {
    organizationMemberFindFirst.mockResolvedValue({ id: 'member-1' });

    const exists = await repository.userExistsInOrganization('org-1', 'user-1');

    expect(organizationMemberFindFirst).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        userId: 'user-1',
        status: 'ACTIVE',
        user: {
          deletedAt: null,
          isActive: true,
        },
      },
      select: { id: true },
    });
    expect(exists).toBe(true);
  });
});
