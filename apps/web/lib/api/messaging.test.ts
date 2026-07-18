import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

import { MessagingApi } from './messaging';

const currentUser = { id: 'teacher-1', name: 'Ada Teacher' };
const conversation = {
  id: 'conversation-1',
  organizationId: 'organization-1',
  type: 'DIRECT',
  title: 'Assignment question',
  participants: [
    {
      id: 'participant-1',
      organizationId: 'organization-1',
      conversationId: 'conversation-1',
      userId: 'teacher-1',
      joinedAt: '2026-07-01T00:00:00.000Z',
      lastReadAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 'participant-2',
      organizationId: 'organization-1',
      conversationId: 'conversation-1',
      userId: 'student-1',
      joinedAt: '2026-07-01T00:00:00.000Z',
      lastReadAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-18T09:00:00.000Z',
};
const message = {
  id: 'message-1',
  organizationId: 'organization-1',
  conversationId: 'conversation-1',
  senderId: 'student-1',
  body: 'I have a question.',
  attachments: [],
  createdAt: '2026-07-18T09:00:00.000Z',
  updatedAt: '2026-07-18T09:00:00.000Z',
  deletedAt: null,
};

describe('MessagingApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('lists conversations and hydrates each thread through apiFetch', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        items: [conversation],
        meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        items: [message],
        meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
      });

    const result = await MessagingApi.getConversations({
      organizationId: 'organization-1',
      type: 'DIRECT',
      search: 'Assignment',
      page: 1,
      limit: 100,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      currentUser,
    });

    expect(apiFetchMock).toHaveBeenNthCalledWith(
      1,
      '/conversations?organizationId=organization-1&type=DIRECT&search=Assignment&page=1&limit=100&sortBy=updatedAt&sortOrder=desc',
    );
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      2,
      '/conversations/conversation-1/messages?page=1&limit=100&sortBy=createdAt&sortOrder=asc',
    );
    expect(result.items[0]).toMatchObject({
      id: 'conversation-1',
      unreadCount: 1,
      lastMessage: { id: 'message-1' },
    });
    expect(result.meta.total).toBe(1);
  });

  it('supports conversation detail, create, update, and participant methods', async () => {
    apiFetchMock.mockResolvedValueOnce(conversation).mockResolvedValueOnce({
      items: [message],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    await expect(MessagingApi.getConversation(conversation.id, currentUser)).resolves.toMatchObject(
      { id: conversation.id },
    );

    apiFetchMock.mockResolvedValue(conversation);
    await MessagingApi.createConversation(
      {
        organizationId: 'organization-1',
        type: 'DIRECT',
        title: 'New conversation',
        participantUserIds: ['student-1'],
      },
      currentUser,
    );
    expect(apiFetchMock).toHaveBeenCalledWith('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'organization-1',
        type: 'DIRECT',
        title: 'New conversation',
        participantUserIds: ['student-1'],
      }),
    });

    await MessagingApi.updateConversation(conversation.id, { title: 'Updated' }, currentUser);
    expect(apiFetchMock).toHaveBeenCalledWith(`/conversations/${conversation.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });

    await MessagingApi.addConversationParticipant(conversation.id, 'student-2', currentUser);
    expect(apiFetchMock).toHaveBeenCalledWith(`/conversations/${conversation.id}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId: 'student-2' }),
    });
  });

  it('supports message listing, sending, and deleting', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [message],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    const result = await MessagingApi.getMessages(
      conversation.id,
      {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      },
      currentUser,
    );
    expect(result.items).toHaveLength(1);
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/conversations/${conversation.id}/messages?page=1&limit=20&sortBy=createdAt&sortOrder=asc`,
    );

    apiFetchMock.mockResolvedValue(message);
    await MessagingApi.sendMessage(conversation.id, { body: 'Reply' }, currentUser);
    expect(apiFetchMock).toHaveBeenCalledWith(`/conversations/${conversation.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: 'Reply' }),
    });

    await MessagingApi.deleteMessage(message.id, currentUser);
    expect(apiFetchMock).toHaveBeenCalledWith(`/messages/${message.id}`, {
      method: 'DELETE',
    });
  });
});
