import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  ConversationConflictException,
  ConversationNotFoundException,
  InvalidConversationException,
  OrganizationAccessDeniedException,
  ParticipantForbiddenException,
} from '../exceptions';
import type {
  ConversationWithParticipantsRecord,
  MessagingRepository,
} from '../interfaces/messaging-repository.interface';
import { MessagingService } from '../services/messaging.service';

function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-admin',
    email: 'admin@example.com',
    roles: [AUTH_ROLES.admin],
    permissions: [AUTH_PERMISSIONS.courseCreate, AUTH_PERMISSIONS.courseUpdate],
    organizationIds: ['org-1'],
    ...overrides,
  };
}

function buildConversation(
  overrides: Partial<ConversationWithParticipantsRecord> = {},
): ConversationWithParticipantsRecord {
  return {
    id: 'conversation-1',
    organizationId: 'org-1',
    type: 'DIRECT',
    title: 'Support',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    participants: [
      {
        id: 'participant-1',
        organizationId: 'org-1',
        conversationId: 'conversation-1',
        userId: 'user-admin',
        joinedAt: new Date('2026-01-01T00:00:00.000Z'),
        lastReadAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    ...overrides,
  };
}

describe('MessagingService', () => {
  const findConversationById = vi.fn();
  const findConversations = vi.fn();
  const isParticipant = vi.fn();
  const userExistsInOrganization = vi.fn();
  const createConversation = vi.fn();
  const updateConversation = vi.fn();
  const addParticipant = vi.fn();
  const findMessages = vi.fn();
  const findMessageById = vi.fn();
  const createMessage = vi.fn();
  const softDeleteMessage = vi.fn();

  let service: MessagingService;

  beforeEach(() => {
    vi.clearAllMocks();

    const repository: MessagingRepository = {
      marker: 'messaging-repository',
      findConversationById,
      findConversations,
      isParticipant,
      userExistsInOrganization,
      createConversation,
      updateConversation,
      addParticipant,
      findMessages,
      findMessageById,
      createMessage,
      softDeleteMessage,
    };

    service = new MessagingService(repository);
  });

  it('lists conversations for admins without participant filtering', async () => {
    findConversations.mockResolvedValue({ items: [buildConversation()], total: 1 });

    const result = await service.listConversations(createUser(), {
      page: 1,
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    expect(findConversations).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        participantUserId: undefined,
      }),
    );
    expect(result.data.meta.totalPages).toBe(1);
  });

  it('filters conversations to the current user when not admin', async () => {
    findConversations.mockResolvedValue({ items: [], total: 0 });

    await service.listConversations(
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] }),
      {
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
    );

    expect(findConversations).toHaveBeenCalledWith(
      expect.objectContaining({ participantUserId: 'user-student' }),
    );
  });

  it('rejects conversation access for non-participants', async () => {
    findConversationById.mockResolvedValue(buildConversation());
    isParticipant.mockResolvedValue(false);

    await expect(
      service.getConversationById(
        createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] }),
        'conversation-1',
      ),
    ).rejects.toBeInstanceOf(ParticipantForbiddenException);
  });

  it('creates a conversation with validated participants', async () => {
    userExistsInOrganization.mockResolvedValue(true);
    createConversation.mockResolvedValue(buildConversation());

    const result = await service.createConversation(createUser(), {
      organizationId: 'org-1',
      type: 'DIRECT',
      participantUserIds: ['user-2'],
    });

    expect(createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorUserId: 'user-admin',
        participantUserIds: ['user-2'],
      }),
    );
    expect(result.data.id).toBe('conversation-1');
  });

  it('rejects conversation creation without additional participants', async () => {
    await expect(
      service.createConversation(createUser(), {
        organizationId: 'org-1',
        type: 'DIRECT',
        participantUserIds: ['user-admin'],
      }),
    ).rejects.toBeInstanceOf(InvalidConversationException);
  });

  it('rejects organization access outside membership', async () => {
    await expect(
      service.listConversations(createUser(), {
        organizationId: 'org-other',
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      }),
    ).rejects.toBeInstanceOf(OrganizationAccessDeniedException);
  });

  it('adds a participant when the user is not already present', async () => {
    findConversationById
      .mockResolvedValueOnce(buildConversation())
      .mockResolvedValueOnce(buildConversation());
    userExistsInOrganization.mockResolvedValue(true);
    isParticipant.mockResolvedValue(false);
    addParticipant.mockResolvedValue({});

    const result = await service.addParticipant(createUser(), 'conversation-1', {
      userId: 'user-2',
    });

    expect(addParticipant).toHaveBeenCalledWith('org-1', 'conversation-1', 'user-2');
    expect(result.data.id).toBe('conversation-1');
  });

  it('rejects duplicate participants', async () => {
    findConversationById.mockResolvedValue(buildConversation());
    userExistsInOrganization.mockResolvedValue(true);
    isParticipant.mockResolvedValue(true);

    await expect(
      service.addParticipant(createUser(), 'conversation-1', { userId: 'user-2' }),
    ).rejects.toBeInstanceOf(ConversationConflictException);
  });

  it('allows participants to send messages', async () => {
    findConversationById.mockResolvedValue(buildConversation());
    isParticipant.mockResolvedValue(true);
    createMessage.mockResolvedValue({
      id: 'message-1',
      organizationId: 'org-1',
      conversationId: 'conversation-1',
      senderId: 'user-student',
      body: 'Hello',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await service.sendMessage(
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] }),
      'conversation-1',
      { body: 'Hello' },
    );

    expect(createMessage).toHaveBeenCalled();
    expect(result.data.body).toBe('Hello');
  });

  it('soft-deletes a message for the sender', async () => {
    findMessageById.mockResolvedValue({
      id: 'message-1',
      organizationId: 'org-1',
      conversationId: 'conversation-1',
      senderId: 'user-student',
      body: 'Hello',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    softDeleteMessage.mockResolvedValue({
      id: 'message-1',
      organizationId: 'org-1',
      conversationId: 'conversation-1',
      senderId: 'user-student',
      body: 'Hello',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
    });

    const result = await service.deleteMessage(
      createUser({ id: 'user-student', roles: [AUTH_ROLES.student], permissions: [] }),
      'message-1',
    );

    expect(softDeleteMessage).toHaveBeenCalledWith('message-1');
    expect(result.data.deletedAt).not.toBeNull();
  });

  it('throws when a conversation is missing', async () => {
    findConversationById.mockResolvedValue(null);

    await expect(service.getConversationById(createUser(), 'missing')).rejects.toBeInstanceOf(
      ConversationNotFoundException,
    );
  });
});
