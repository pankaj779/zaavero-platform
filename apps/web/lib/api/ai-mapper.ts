export interface AIConversationResponseDto {
  id: string;
  organizationId: string;
  userId: string;
  courseId: string | null;
  lessonId: string | null;
  assignmentId: string | null;
  feature: string;
  title: string | null;
  provider: string;
  model: string;
  pinned: boolean;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessageResponseDto {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  provider: string | null;
  model: string | null;
  citations: unknown;
  finishReason: string | null;
  tokenPrompt: number;
  tokenCompletion: number;
  latencyMs: number | null;
  createdAt: string;
}

export interface AIPageMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AISearchHitResponseDto {
  documentId: string;
  title: string;
  content: string;
  score: number;
  sourceType: string;
  courseId: string | null;
  lessonId: string | null;
}

export interface AIConversationDetailDto {
  conversation: AIConversationResponseDto;
  messages: AIMessageResponseDto[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, field: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  throw new Error(`Invalid AI payload field: ${field}`);
}

function readOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

export function mapAIConversation(value: unknown): AIConversationResponseDto {
  if (!isRecord(value)) throw new Error('Invalid AI conversation payload.');
  return {
    id: readString(value.id, 'id'),
    organizationId: readString(value.organizationId, 'organizationId'),
    userId: readString(value.userId, 'userId'),
    courseId: readOptionalString(value.courseId),
    lessonId: readOptionalString(value.lessonId),
    assignmentId: readOptionalString(value.assignmentId),
    feature: readString(value.feature, 'feature'),
    title: readOptionalString(value.title),
    provider: readString(value.provider, 'provider'),
    model: readString(value.model, 'model'),
    pinned: Boolean(value.pinned),
    lastMessageAt: readOptionalString(value.lastMessageAt),
    createdAt: readString(value.createdAt, 'createdAt'),
    updatedAt: readString(value.updatedAt, 'updatedAt'),
  };
}

export function mapAIMessage(value: unknown): AIMessageResponseDto {
  if (!isRecord(value)) throw new Error('Invalid AI message payload.');
  return {
    id: readString(value.id, 'id'),
    conversationId: readString(value.conversationId, 'conversationId'),
    role: readString(value.role, 'role'),
    content: readString(value.content, 'content'),
    provider: readOptionalString(value.provider),
    model: readOptionalString(value.model),
    citations: value.citations ?? null,
    finishReason: readOptionalString(value.finishReason),
    tokenPrompt: Number(value.tokenPrompt ?? 0),
    tokenCompletion: Number(value.tokenCompletion ?? 0),
    latencyMs: value.latencyMs === null || value.latencyMs === undefined ? null : Number(value.latencyMs),
    createdAt: readString(value.createdAt, 'createdAt'),
  };
}

export function mapAIConversationDetail(value: unknown): AIConversationDetailDto {
  if (!isRecord(value) || !isRecord(value.conversation) || !Array.isArray(value.messages)) {
    throw new Error('Invalid AI conversation detail payload.');
  }
  return {
    conversation: mapAIConversation(value.conversation),
    messages: value.messages.map((message) => mapAIMessage(message)),
  };
}

export function mapAIConversationPage(value: unknown): {
  items: AIConversationResponseDto[];
  meta: AIPageMetaDto;
} {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.meta)) {
    throw new Error('Invalid AI conversation page payload.');
  }
  return {
    items: value.items.map((item) => mapAIConversation(item)),
    meta: {
      total: Number(value.meta.total ?? 0),
      page: Number(value.meta.page ?? 1),
      limit: Number(value.meta.limit ?? 20),
      totalPages: Number(value.meta.totalPages ?? 1),
    },
  };
}

export function mapAISearchHit(value: unknown): AISearchHitResponseDto {
  if (!isRecord(value)) throw new Error('Invalid AI search hit payload.');
  return {
    documentId: readString(value.documentId, 'documentId'),
    title: readString(value.title, 'title'),
    content: readString(value.content, 'content'),
    score: Number(value.score ?? 0),
    sourceType: readString(value.sourceType, 'sourceType'),
    courseId: readOptionalString(value.courseId),
    lessonId: readOptionalString(value.lessonId),
  };
}

export function mapAIGenerateResult(value: unknown): {
  conversationId: string;
  messageId: string;
  content: string;
  provider: string;
  model: string;
} {
  if (!isRecord(value)) throw new Error('Invalid AI generate payload.');
  return {
    conversationId: readString(value.conversationId, 'conversationId'),
    messageId: readString(value.messageId, 'messageId'),
    content: readString(value.content, 'content'),
    provider: readString(value.provider, 'provider'),
    model: readString(value.model, 'model'),
  };
}

export function mapAIProviderHealth(value: unknown): {
  provider: string;
  configured: boolean;
  healthy: boolean;
  latencyMs?: number;
  message?: string;
} {
  if (!isRecord(value)) throw new Error('Invalid AI provider health payload.');
  return {
    provider: readString(value.provider, 'provider'),
    configured: Boolean(value.configured),
    healthy: Boolean(value.healthy),
    latencyMs: value.latencyMs === undefined ? undefined : Number(value.latencyMs),
    message: readOptionalString(value.message) ?? undefined,
  };
}

export function mapAIUsageSummary(value: unknown): {
  totalTokens: number;
  totalRequests: number;
  byFeature: { feature: string; totalTokens: number; requests: number }[];
  byProvider: { provider: string; totalTokens: number; requests: number }[];
} {
  if (!isRecord(value)) throw new Error('Invalid AI usage summary payload.');
  return {
    totalTokens: Number(value.totalTokens ?? 0),
    totalRequests: Number(value.totalRequests ?? 0),
    byFeature: Array.isArray(value.byFeature)
      ? value.byFeature.map((row) => {
          const item = row as Record<string, unknown>;
          return {
            feature: readString(item.feature, 'feature'),
            totalTokens: Number(item.totalTokens ?? 0),
            requests: Number(item.requests ?? 0),
          };
        })
      : [],
    byProvider: Array.isArray(value.byProvider)
      ? value.byProvider.map((row) => {
          const item = row as Record<string, unknown>;
          return {
            provider: readString(item.provider, 'provider'),
            totalTokens: Number(item.totalTokens ?? 0),
            requests: Number(item.requests ?? 0),
          };
        })
      : [],
  };
}
