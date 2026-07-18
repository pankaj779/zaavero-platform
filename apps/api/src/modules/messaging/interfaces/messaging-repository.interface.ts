import type {
  ConversationSortField,
  ConversationTypeValue,
  MessageSortField,
} from '../constants/messaging.constants';

export interface ConversationRecord {
  id: string;
  organizationId: string;
  type: ConversationTypeValue;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipantRecord {
  id: string;
  organizationId: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithParticipantsRecord extends ConversationRecord {
  participants: ConversationParticipantRecord[];
}

export interface MessageRecord {
  id: string;
  organizationId: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ConversationListFilters {
  organizationId: string;
  participantUserId?: string;
  type?: ConversationTypeValue;
  search?: string;
  page: number;
  limit: number;
  sortBy: ConversationSortField;
  sortOrder: 'asc' | 'desc';
}

export interface MessageListFilters {
  organizationId: string;
  conversationId: string;
  page: number;
  limit: number;
  sortBy: MessageSortField;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedListResult<T> {
  items: T[];
  total: number;
}

export interface CreateConversationData {
  organizationId: string;
  type: ConversationTypeValue;
  title?: string | null;
  creatorUserId: string;
  participantUserIds: string[];
}

export interface UpdateConversationData {
  title?: string | null;
}

export interface CreateMessageData {
  organizationId: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachments?: string[];
}

export interface MessagingRepository {
  readonly marker: 'messaging-repository';

  findConversationById(id: string): Promise<ConversationWithParticipantsRecord | null>;

  findConversations(
    filters: ConversationListFilters,
  ): Promise<PaginatedListResult<ConversationWithParticipantsRecord>>;

  isParticipant(conversationId: string, userId: string): Promise<boolean>;

  userExistsInOrganization(organizationId: string, userId: string): Promise<boolean>;

  createConversation(data: CreateConversationData): Promise<ConversationWithParticipantsRecord>;

  updateConversation(
    id: string,
    data: UpdateConversationData,
  ): Promise<ConversationWithParticipantsRecord>;

  addParticipant(
    organizationId: string,
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipantRecord>;

  findMessages(filters: MessageListFilters): Promise<PaginatedListResult<MessageRecord>>;

  findMessageById(id: string): Promise<MessageRecord | null>;

  createMessage(data: CreateMessageData): Promise<MessageRecord>;

  softDeleteMessage(id: string): Promise<MessageRecord>;
}
