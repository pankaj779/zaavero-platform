import {
  teacherMessageComingSoonFeatures,
  type TeacherAttachmentDto,
  type TeacherConversationDto,
  type TeacherConversationType,
  type TeacherMessageDto,
  type TeacherMessageStatus,
  type TeacherParticipantDto,
} from '../teacher/message-types';

export interface ConversationParticipantApiRecord {
  id: string;
  organizationId: string;
  conversationId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationApiRecord {
  id: string;
  organizationId: string;
  type: 'DIRECT' | 'BATCH' | 'SUPPORT';
  title: string | null;
  participants: ConversationParticipantApiRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageApiRecord {
  id: string;
  organizationId: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MessagingListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessagingCurrentUser {
  id: string;
  name?: string;
}

export interface ConversationListResult {
  items: TeacherConversationDto[];
  meta: MessagingListMeta;
}

export interface MessageListResult {
  items: TeacherMessageDto[];
  meta: MessagingListMeta;
}

function initials(name: string): string {
  const value = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return value || 'P';
}

function currentUserName(currentUser?: MessagingCurrentUser): string {
  const name = currentUser?.name?.trim();
  return name !== undefined && name.length > 0 ? name : 'Teacher';
}

export function mapConversationType(type: ConversationApiRecord['type']): TeacherConversationType {
  switch (type) {
    case 'BATCH':
      return 'batch';
    case 'SUPPORT':
      return 'announcement';
    case 'DIRECT':
      return 'student';
  }
}

function participantRole(
  userId: string,
  type: ConversationApiRecord['type'],
  currentUser?: MessagingCurrentUser,
): TeacherParticipantDto['role'] {
  if (currentUser?.id === userId) {
    return 'teacher';
  }
  return type === 'SUPPORT' ? 'system' : 'student';
}

function mapParticipants(
  record: ConversationApiRecord,
  currentUser?: MessagingCurrentUser,
): TeacherParticipantDto[] {
  return record.participants.map((participant) => {
    const isCurrentUser = currentUser?.id === participant.userId;
    const role = participantRole(participant.userId, record.type, currentUser);
    const name = isCurrentUser
      ? currentUserName(currentUser)
      : role === 'system'
        ? 'Support'
        : 'Participant';

    return {
      id: participant.userId,
      name,
      role,
      initials: initials(name),
    };
  });
}

function mapAttachments(record: MessageApiRecord): TeacherAttachmentDto[] {
  return record.attachments.map((_, index) => ({
    id: `${record.id}-attachment-${String(index + 1)}`,
    label: `Attachment ${String(index + 1)}`,
    kind: 'file',
  }));
}

function messageStatus(
  message: MessageApiRecord,
  participants: ConversationParticipantApiRecord[],
  currentUser?: MessagingCurrentUser,
): TeacherMessageStatus {
  if (message.senderId !== currentUser?.id) {
    return 'delivered';
  }

  const readByAnotherParticipant = participants.some(
    (participant) =>
      participant.userId !== message.senderId &&
      participant.lastReadAt !== null &&
      new Date(participant.lastReadAt).getTime() >= new Date(message.createdAt).getTime(),
  );
  return readByAnotherParticipant ? 'read' : 'sent';
}

export function mapMessageApiToTeacherDto(
  record: MessageApiRecord,
  participants: TeacherParticipantDto[] = [],
  participantRecords: ConversationParticipantApiRecord[] = [],
  currentUser?: MessagingCurrentUser,
): TeacherMessageDto {
  const sender =
    participants.find((participant) => participant.id === record.senderId) ??
    ({
      id: record.senderId,
      name: record.senderId === currentUser?.id ? currentUserName(currentUser) : 'Participant',
      role: record.senderId === currentUser?.id ? 'teacher' : 'student',
      initials: record.senderId === currentUser?.id ? 'T' : 'P',
    } satisfies TeacherParticipantDto);

  return {
    id: record.id,
    sender,
    timestamp: record.createdAt,
    body: record.deletedAt === null ? record.body : '',
    attachments: record.deletedAt === null ? mapAttachments(record) : [],
    status: messageStatus(record, participantRecords, currentUser),
  };
}

function emptyLastMessage(
  record: ConversationApiRecord,
  participants: TeacherParticipantDto[],
): TeacherMessageDto {
  const sender =
    participants[0] ??
    ({
      id: '',
      name: 'System',
      role: 'system',
      initials: 'SY',
    } satisfies TeacherParticipantDto);

  return {
    id: `${record.id}-empty`,
    sender,
    timestamp: record.updatedAt,
    body: '',
    attachments: [],
    status: 'sent',
  };
}

/**
 * Maps backend conversation + message records into the existing Teacher UI DTO.
 *
 * TEMPORARY PLACEHOLDERS:
 * - participant names/roles are unavailable except for the authenticated user
 * - course context is not returned by the Messaging API
 * - SUPPORT maps to the existing announcement presentation category
 * - attachment strings are represented as non-downloadable numbered files
 * - empty conversations receive an empty last-message display record
 */
export function mapConversationApiToTeacherDto(
  record: ConversationApiRecord,
  messageRecords: MessageApiRecord[] = [],
  currentUser?: MessagingCurrentUser,
): TeacherConversationDto {
  const participants = mapParticipants(record, currentUser);
  const messages = [...messageRecords]
    .filter((message) => message.deletedAt === null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((message) =>
      mapMessageApiToTeacherDto(message, participants, record.participants, currentUser),
    );
  const currentParticipant = record.participants.find(
    (participant) => participant.userId === currentUser?.id,
  );
  const lastReadAt = currentParticipant?.lastReadAt
    ? new Date(currentParticipant.lastReadAt).getTime()
    : null;
  const unreadCount = currentUser
    ? messageRecords.filter(
        (message) =>
          message.deletedAt === null &&
          message.senderId !== currentUser.id &&
          (lastReadAt === null || new Date(message.createdAt).getTime() > lastReadAt),
      ).length
    : 0;
  const lastMessage = messages.at(-1) ?? emptyLastMessage(record, participants);
  const mappedType = mapConversationType(record.type);

  return {
    id: record.id,
    title:
      record.title?.trim() ??
      (mappedType === 'batch'
        ? 'Batch conversation'
        : mappedType === 'announcement'
          ? 'Support conversation'
          : 'Direct conversation'),
    type: mappedType,
    unreadCount,
    lastMessage,
    updatedAt: lastMessage.body ? lastMessage.timestamp : record.updatedAt,
    participants,
    messages,
    courseTitle: null,
    futureFeatures: teacherMessageComingSoonFeatures,
  };
}

export function mapConversationApiList(
  records: ConversationApiRecord[],
  messagesByConversation: ReadonlyMap<string, MessageApiRecord[]> = new Map(),
  currentUser?: MessagingCurrentUser,
): TeacherConversationDto[] {
  return records.map((record) =>
    mapConversationApiToTeacherDto(
      record,
      messagesByConversation.get(record.id) ?? [],
      currentUser,
    ),
  );
}
