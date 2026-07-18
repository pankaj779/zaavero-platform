export const CONVERSATION_TYPES = ['DIRECT', 'BATCH', 'SUPPORT'] as const;

export type ConversationTypeValue = (typeof CONVERSATION_TYPES)[number];

export const CONVERSATION_SORT_FIELDS = ['createdAt', 'updatedAt'] as const;

export type ConversationSortField = (typeof CONVERSATION_SORT_FIELDS)[number];

export const MESSAGE_SORT_FIELDS = ['createdAt'] as const;

export type MessageSortField = (typeof MESSAGE_SORT_FIELDS)[number];

export const MESSAGING_DEFAULT_PAGE = 1;
export const MESSAGING_DEFAULT_LIMIT = 20;
export const MESSAGING_MAX_LIMIT = 100;
