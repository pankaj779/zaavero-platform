import { describe, expect, it } from 'vitest';
import {
  mapConversationApiList,
  mapConversationApiToTeacherDto,
  mapConversationType,
  type ConversationApiRecord,
  type MessageApiRecord,
} from './messaging-mapper';
import { toConversationApiType, toConversationListSort } from '../teacher/message-types';

const currentUser = { id: 'teacher-1', name: 'Ada Teacher' };

const conversation: ConversationApiRecord = {
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
      lastReadAt: '2026-07-18T08:30:00.000Z',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-18T08:30:00.000Z',
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

const messages: MessageApiRecord[] = [
  {
    id: 'message-1',
    organizationId: 'organization-1',
    conversationId: 'conversation-1',
    senderId: 'teacher-1',
    body: 'How can I help?',
    attachments: [],
    createdAt: '2026-07-18T08:00:00.000Z',
    updatedAt: '2026-07-18T08:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'message-2',
    organizationId: 'organization-1',
    conversationId: 'conversation-1',
    senderId: 'student-1',
    body: 'I have a question.',
    attachments: ['private-storage-reference'],
    createdAt: '2026-07-18T09:00:00.000Z',
    updatedAt: '2026-07-18T09:00:00.000Z',
    deletedAt: null,
  },
];

describe('messaging mapper', () => {
  it('maps conversations, participants, messages, attachments, and unread count', () => {
    const dto = mapConversationApiToTeacherDto(conversation, messages, currentUser);

    expect(dto).toMatchObject({
      id: 'conversation-1',
      title: 'Assignment question',
      type: 'student',
      unreadCount: 1,
      courseTitle: null,
      updatedAt: '2026-07-18T09:00:00.000Z',
    });
    expect(dto.participants[0]).toMatchObject({
      id: 'teacher-1',
      name: 'Ada Teacher',
      role: 'teacher',
      initials: 'AT',
    });
    expect(dto.participants[1]).toMatchObject({
      id: 'student-1',
      name: 'Participant',
      role: 'student',
    });
    expect(dto.messages[1]?.attachments).toEqual([
      {
        id: 'message-2-attachment-1',
        label: 'Attachment 1',
        kind: 'file',
      },
    ]);
    expect(dto.lastMessage.id).toBe('message-2');
    expect(dto.futureFeatures.realtime).toBe('coming_soon');
  });

  it('maps backend types and creates a safe display record for empty threads', () => {
    expect(mapConversationType('DIRECT')).toBe('student');
    expect(mapConversationType('BATCH')).toBe('batch');
    expect(mapConversationType('SUPPORT')).toBe('announcement');

    const dto = mapConversationApiToTeacherDto(
      { ...conversation, type: 'BATCH', title: null },
      [],
      currentUser,
    );
    expect(dto.title).toBe('Batch conversation');
    expect(dto.messages).toEqual([]);
    expect(dto.lastMessage).toMatchObject({
      id: 'conversation-1-empty',
      body: '',
    });
  });

  it('maps lists and UI filters to supported backend query values', () => {
    const items = mapConversationApiList(
      [conversation],
      new Map([[conversation.id, messages]]),
      currentUser,
    );
    expect(items).toHaveLength(1);
    expect(toConversationApiType('students')).toBe('DIRECT');
    expect(toConversationApiType('unread')).toBeUndefined();
    expect(toConversationListSort()).toEqual({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  });
});
