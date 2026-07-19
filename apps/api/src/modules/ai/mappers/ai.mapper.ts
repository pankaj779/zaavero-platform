import type {
  AIConversationRecord,
  AIDocumentRecord,
  AIMessageRecord,
  PaginatedResult,
  RetrievalHit,
} from '../interfaces/ai-repository.interface';

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

export interface AIDocumentResponseDto {
  id: string;
  organizationId: string;
  title: string;
  sourceType: string;
  sourceKey: string;
  status: string;
  chunkCount: number;
  tokenCount: number;
  courseId: string | null;
  lessonId: string | null;
  assignmentId: string | null;
  mediaAssetId: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface AIPageMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAIConversationsResponseDto {
  items: AIConversationResponseDto[];
  meta: AIPageMetaDto;
}

export interface PaginatedAIDocumentsResponseDto {
  items: AIDocumentResponseDto[];
  meta: AIPageMetaDto;
}

export interface AIAdminUsageSummaryDto {
  totalTokens: number;
  totalRequests: number;
  byFeature: Array<{ feature: string; totalTokens: number; requests: number }>;
  byProvider: Array<{ provider: string; totalTokens: number; requests: number }>;
}

export interface AIProviderHealthResponseDto {
  provider: string;
  configured: boolean;
  healthy: boolean;
  latencyMs?: number;
  message?: string;
}

function pageMeta(total: number, page: number, limit: number): AIPageMetaDto {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export const AIMapper = {
  conversation(record: AIConversationRecord): AIConversationResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      userId: record.userId,
      courseId: record.courseId,
      lessonId: record.lessonId,
      assignmentId: record.assignmentId,
      feature: record.feature,
      title: record.title,
      provider: record.provider,
      model: record.model,
      pinned: record.pinnedAt !== null,
      lastMessageAt: record.lastMessageAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },

  message(record: AIMessageRecord): AIMessageResponseDto {
    return {
      id: record.id,
      conversationId: record.conversationId,
      role: record.role,
      content: record.content,
      provider: record.provider,
      model: record.model,
      citations: record.citations,
      finishReason: record.finishReason,
      tokenPrompt: record.tokenPrompt,
      tokenCompletion: record.tokenCompletion,
      latencyMs: record.latencyMs,
      createdAt: record.createdAt.toISOString(),
    };
  },

  document(record: AIDocumentRecord): AIDocumentResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      title: record.title,
      sourceType: record.sourceType,
      sourceKey: record.sourceKey,
      status: record.status,
      chunkCount: record.chunkCount,
      tokenCount: record.tokenCount,
      courseId: record.courseId,
      lessonId: record.lessonId,
      assignmentId: record.assignmentId,
      mediaAssetId: record.mediaAssetId,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },

  searchHit(hit: RetrievalHit): AISearchHitResponseDto {
    return {
      documentId: hit.documentId,
      title: hit.title,
      content: hit.content,
      score: hit.score,
      sourceType: hit.sourceType,
      courseId: hit.courseId,
      lessonId: hit.lessonId,
    };
  },

  conversationPage(
    result: PaginatedResult<AIConversationRecord>,
    page: number,
    limit: number,
  ): PaginatedAIConversationsResponseDto {
    return {
      items: result.items.map((item) => AIMapper.conversation(item)),
      meta: pageMeta(result.total, page, limit),
    };
  },

  documentPage(
    result: PaginatedResult<AIDocumentRecord>,
    page: number,
    limit: number,
  ): PaginatedAIDocumentsResponseDto {
    return {
      items: result.items.map((item) => AIMapper.document(item)),
      meta: pageMeta(result.total, page, limit),
    };
  },

  pageMeta,
};
