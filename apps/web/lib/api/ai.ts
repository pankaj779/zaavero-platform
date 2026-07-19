import { authApi } from '../auth/auth-api';
import { authStorage } from '../auth/auth-storage';
import { authService } from '../auth/auth-service';
import { apiFetch } from '../auth/api-client';
import {
  mapAIConversation,
  mapAIConversationDetail,
  mapAIConversationPage,
  mapAIGenerateResult,
  mapAIProviderHealth,
  mapAISearchHit,
  mapAIUsageSummary,
  type AIConversationDetailDto,
  type AIConversationResponseDto,
  type AIMessageResponseDto,
  type AISearchHitResponseDto,
} from './ai-mapper';

export type AIFeature =
  | 'TUTOR'
  | 'LESSON_SUMMARY'
  | 'ASSIGNMENT_HELP'
  | 'QUIZ_GENERATOR'
  | 'FLASHCARDS'
  | 'COURSE_DESCRIPTION'
  | 'CERTIFICATE_FEEDBACK'
  | 'ANNOUNCEMENT_WRITER'
  | 'EMAIL_WRITER'
  | 'PERFORMANCE_INSIGHTS'
  | 'ADMIN_INSIGHTS'
  | 'SEMANTIC_SEARCH'
  | 'GENERAL';

export interface AIListParams {
  organizationId: string;
  search?: string;
  feature?: AIFeature;
  page?: number;
  limit?: number;
}

export interface AIListResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AIStreamHandlers {
  onStart?: (payload: { conversationId: string }) => void;
  onToken?: (delta: string) => void;
  onCitation?: (citations: unknown[]) => void;
  onUsage?: (usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
  onDone?: (payload: { conversationId: string; messageId: string; finishReason: string | null }) => void;
  onError?: (message: string) => void;
}

export interface AIChatStreamInput {
  organizationId: string;
  feature: AIFeature;
  message: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  parentMessageId?: string;
  signal?: AbortSignal;
  handlers?: AIStreamHandlers;
}

export interface AIGenerateInput {
  organizationId: string;
  feature: AIFeature;
  variables: Record<string, unknown>;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  conversationId?: string;
}

export interface AIGenerateResultDto {
  conversationId: string;
  messageId: string;
  content: string;
  provider: string;
  model: string;
}

export interface AIProviderHealthDto {
  provider: string;
  configured: boolean;
  healthy: boolean;
  latencyMs?: number;
  message?: string;
}

export interface AIAdminUsageSummaryDto {
  totalTokens: number;
  totalRequests: number;
  byFeature: { feature: string; totalTokens: number; requests: number }[];
  byProvider: { provider: string; totalTokens: number; requests: number }[];
}

export interface AIEngagementInsightsDto {
  activeMembers: number;
  newEnrollments30d: number;
  submissions30d: number;
  aiTokens30d: number;
  aiRequests30d: number;
}

interface ApiPage<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function listQuery(params: AIListParams): string {
  const search = new URLSearchParams();
  search.set('organizationId', params.organizationId);
  if (params.search) search.set('search', params.search);
  if (params.feature) search.set('feature', params.feature);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function streamChat(input: AIChatStreamInput): Promise<void> {
  const base = authApi.baseUrl();
  const url = `${base}/ai/student/chat/stream`;
  const execute = async (accessToken: string | null): Promise<Response> => {
    return fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        organizationId: input.organizationId,
        feature: input.feature,
        message: input.message,
        conversationId: input.conversationId,
        courseId: input.courseId,
        lessonId: input.lessonId,
        assignmentId: input.assignmentId,
        parentMessageId: input.parentMessageId,
      }),
      signal: input.signal,
    });
  };

  let response = await execute(authStorage.getAccessToken());
  if (response.status === 401) {
    const refreshed = await authService.refresh();
    if (!refreshed) throw new Error('Authentication required.');
    response = await execute(authStorage.getAccessToken());
  }
  if (!response.ok || !response.body) {
    throw new Error(`AI stream failed with status ${String(response.status)}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let reading = true;
  while (reading) {
    const { done, value } = await reader.read();
    if (done) {
      reading = false;
      continue;
    }
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      const lines = block.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const dataLine = lines.find((line) => line.startsWith('data:'));
      if (!eventLine || !dataLine) continue;
      const event = eventLine.slice(6).trim();
      const data = JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>;
      if (event === 'start') {
        input.handlers?.onStart?.(data as { conversationId: string });
      } else if (event === 'token') {
        const delta = data.delta;
        input.handlers?.onToken?.(typeof delta === 'string' ? delta : '');
      } else if (event === 'citation') {
        const citations = data.citations;
        input.handlers?.onCitation?.(Array.isArray(citations) ? citations : []);
      } else if (event === 'usage') {
        input.handlers?.onUsage?.(
          data as { promptTokens: number; completionTokens: number; totalTokens: number },
        );
      } else if (event === 'done') {
        input.handlers?.onDone?.(
          data as { conversationId: string; messageId: string; finishReason: string | null },
        );
      } else if (event === 'error') {
        const message = data.message;
        input.handlers?.onError?.(typeof message === 'string' ? message : 'Generation failed.');
      }
    }
  }
}

export const AiApi = {
  listConversations(params: AIListParams): Promise<AIListResult<AIConversationResponseDto>> {
    return apiFetch<ApiPage<unknown>>(`/ai/student/conversations${listQuery(params)}`).then(
      mapAIConversationPage,
    );
  },

  getConversation(organizationId: string, id: string): Promise<AIConversationDetailDto> {
    return apiFetch<unknown>(
      `/ai/student/conversations/${id}?organizationId=${encodeURIComponent(organizationId)}`,
    ).then(mapAIConversationDetail);
  },

  createConversation(input: {
    organizationId: string;
    feature: AIFeature;
    title?: string;
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
  }): Promise<AIConversationResponseDto> {
    return apiFetch<unknown>('/ai/student/conversations', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(mapAIConversation);
  },

  deleteConversation(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    return apiFetch<{ deleted: boolean }>(
      `/ai/student/conversations/${id}?organizationId=${encodeURIComponent(organizationId)}`,
      { method: 'DELETE' },
    );
  },

  streamChat,

  submitFeedback(
    organizationId: string,
    messageId: string,
    input: { rating: 'UP' | 'DOWN'; reason?: string; comment?: string },
  ): Promise<{ saved: boolean }> {
    return apiFetch<{ saved: boolean }>(`/ai/student/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ organizationId, ...input }),
    });
  },

  semanticSearch(input: {
    organizationId: string;
    query: string;
    courseId?: string;
    lessonId?: string;
  }): Promise<AISearchHitResponseDto[]> {
    return apiFetch<unknown[]>('/ai/student/search', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((rows) => rows.map((row) => mapAISearchHit(row)));
  },

  generate(input: AIGenerateInput): Promise<AIGenerateResultDto> {
    return apiFetch<unknown>('/ai/teacher/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(mapAIGenerateResult);
  },

  getProviderHealth(): Promise<AIProviderHealthDto> {
    return apiFetch<unknown>('/ai/admin/provider/health').then(mapAIProviderHealth);
  },

  getUsageSummary(organizationId: string, days = 30): Promise<AIAdminUsageSummaryDto> {
    return apiFetch<unknown>(
      `/ai/admin/usage?organizationId=${encodeURIComponent(organizationId)}&days=${String(days)}`,
    ).then(mapAIUsageSummary);
  },

  getEngagementInsights(organizationId: string): Promise<AIEngagementInsightsDto> {
    return apiFetch<AIEngagementInsightsDto>(
      `/ai/admin/insights/engagement?organizationId=${encodeURIComponent(organizationId)}`,
    );
  },
};

export type { AIMessageResponseDto, AIConversationDetailDto, AIConversationResponseDto, AISearchHitResponseDto };
