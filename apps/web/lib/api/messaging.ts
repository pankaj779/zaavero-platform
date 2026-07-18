import { apiFetch } from '../auth/api-client';
import type { TeacherConversationDto, TeacherMessageDto } from '../teacher/message-types';
import {
  mapConversationApiList,
  mapConversationApiToTeacherDto,
  mapMessageApiToTeacherDto,
  type ConversationApiRecord,
  type ConversationListResult,
  type MessageApiRecord,
  type MessageListResult,
  type MessagingCurrentUser,
  type MessagingListMeta,
} from './messaging-mapper';

export interface ListConversationsParams {
  organizationId?: string;
  type?: 'DIRECT' | 'BATCH' | 'SUPPORT';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  /** Load each conversation's first 100 messages for the existing thread UI. */
  hydrateMessages?: boolean;
  currentUser?: MessagingCurrentUser;
}

export interface ListMessagesParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateConversationInput {
  organizationId: string;
  type: 'DIRECT' | 'BATCH' | 'SUPPORT';
  title?: string;
  participantUserIds: string[];
}

export interface UpdateConversationInput {
  title?: string | null;
}

export interface CreateMessageInput {
  body: string;
  attachments?: string[];
}

interface PaginatedConversationsApiPayload {
  items: ConversationApiRecord[];
  meta: MessagingListMeta;
}

interface PaginatedMessagesApiPayload {
  items: MessageApiRecord[];
  meta: MessagingListMeta;
}

function buildConversationQuery(params: ListConversationsParams): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.type) {
    query.set('type', params.type);
  }
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

function buildMessageQuery(params: ListMessagesParams): string {
  const query = new URLSearchParams();

  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

async function getMessagePayload(
  conversationId: string,
  params: ListMessagesParams = {},
): Promise<PaginatedMessagesApiPayload> {
  return apiFetch<PaginatedMessagesApiPayload>(
    `/conversations/${conversationId}/messages${buildMessageQuery(params)}`,
  );
}

/** All NestJS conversation/message requests flow through this apiFetch client. */
export const MessagingApi = {
  async getConversations(params: ListConversationsParams = {}): Promise<ConversationListResult> {
    const { hydrateMessages = true, currentUser, ...listParams } = params;
    const payload = await apiFetch<PaginatedConversationsApiPayload>(
      `/conversations${buildConversationQuery(listParams)}`,
    );

    const messagesByConversation = new Map<string, MessageApiRecord[]>();
    if (hydrateMessages) {
      const hydrated = await Promise.all(
        payload.items.map(async (conversation) => {
          const messages = await getMessagePayload(conversation.id, {
            page: 1,
            limit: 100,
            sortBy: 'createdAt',
            sortOrder: 'asc',
          });
          return [conversation.id, messages.items] as const;
        }),
      );
      for (const [conversationId, messages] of hydrated) {
        messagesByConversation.set(conversationId, messages);
      }
    }

    return {
      items: mapConversationApiList(payload.items, messagesByConversation, currentUser),
      meta: payload.meta,
    };
  },

  async getConversation(
    id: string,
    currentUser?: MessagingCurrentUser,
  ): Promise<TeacherConversationDto> {
    const [record, messages] = await Promise.all([
      apiFetch<ConversationApiRecord>(`/conversations/${id}`),
      getMessagePayload(id, {
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      }),
    ]);
    return mapConversationApiToTeacherDto(record, messages.items, currentUser);
  },

  async createConversation(
    input: CreateConversationInput,
    currentUser?: MessagingCurrentUser,
  ): Promise<TeacherConversationDto> {
    const record = await apiFetch<ConversationApiRecord>('/conversations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapConversationApiToTeacherDto(record, [], currentUser);
  },

  async updateConversation(
    id: string,
    input: UpdateConversationInput,
    currentUser?: MessagingCurrentUser,
  ): Promise<TeacherConversationDto> {
    const record = await apiFetch<ConversationApiRecord>(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapConversationApiToTeacherDto(record, [], currentUser);
  },

  async addConversationParticipant(
    id: string,
    userId: string,
    currentUser?: MessagingCurrentUser,
  ): Promise<TeacherConversationDto> {
    const record = await apiFetch<ConversationApiRecord>(`/conversations/${id}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return mapConversationApiToTeacherDto(record, [], currentUser);
  },

  async getMessages(
    conversationId: string,
    params: ListMessagesParams = {},
    currentUser?: MessagingCurrentUser,
  ): Promise<MessageListResult> {
    const payload = await getMessagePayload(conversationId, params);
    return {
      items: payload.items.map((message) =>
        mapMessageApiToTeacherDto(message, [], [], currentUser),
      ),
      meta: payload.meta,
    };
  },

  async sendMessage(
    conversationId: string,
    input: CreateMessageInput,
    currentUser?: MessagingCurrentUser,
  ): Promise<TeacherMessageDto> {
    const record = await apiFetch<MessageApiRecord>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapMessageApiToTeacherDto(record, [], [], currentUser);
  },

  async deleteMessage(id: string, currentUser?: MessagingCurrentUser): Promise<TeacherMessageDto> {
    const record = await apiFetch<MessageApiRecord>(`/messages/${id}`, {
      method: 'DELETE',
    });
    return mapMessageApiToTeacherDto(record, [], [], currentUser);
  },
};
