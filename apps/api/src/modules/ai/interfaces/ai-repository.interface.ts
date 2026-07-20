import type {
  AIFeatureValue,
  AIFeedbackRatingValue,
  AIMessageRoleValue,
  AIProviderValue,
} from '../constants/ai.constants';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface AIConversationRecord {
  id: string;
  organizationId: string;
  userId: string;
  courseId: string | null;
  lessonId: string | null;
  assignmentId: string | null;
  feature: AIFeatureValue;
  title: string | null;
  provider: AIProviderValue;
  model: string;
  pinnedAt: Date | null;
  lastMessageAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AIMessageRecord {
  id: string;
  organizationId: string;
  conversationId: string;
  userId: string | null;
  parentMessageId: string | null;
  role: AIMessageRoleValue;
  content: string;
  provider: AIProviderValue | null;
  model: string | null;
  citations: unknown;
  safetyMetadata: unknown;
  finishReason: string | null;
  tokenPrompt: number;
  tokenCompletion: number;
  latencyMs: number | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface AIPromptTemplateRecord {
  id: string;
  scopeKey: string;
  key: string;
  locale: string;
  version: number;
  feature: AIFeatureValue;
  title: string;
  systemPrompt: string;
  userTemplate: string | null;
  variableSchema: unknown;
}

export interface AIDocumentRecord {
  id: string;
  organizationId: string;
  createdById: string | null;
  courseId: string | null;
  lessonId: string | null;
  assignmentId: string | null;
  mediaAssetId: string | null;
  sourceType: string;
  sourceKey: string;
  title: string;
  extractedText: string | null;
  checksumSha256: string | null;
  version: number;
  status: string;
  language: string;
  chunkCount: number;
  tokenCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AIJobRecord {
  id: string;
  organizationId: string;
  requestedById: string | null;
  documentId: string | null;
  courseId: string | null;
  lessonId: string | null;
  assignmentId: string | null;
  conversationId: string | null;
  resultMessageId: string | null;
  type: string;
  status: string;
  priority: number;
  payload: unknown;
  result: unknown;
  availableAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  processedAt: Date | null;
  attempts: number;
  maxAttempts: number;
  backoffSeconds: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  idempotencyKey: string;
  correlationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIUsageTotals {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface RetrievalHit {
  embeddingId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  title: string;
  score: number;
  sourceType: string;
  courseId: string | null;
  lessonId: string | null;
}

export interface CreateConversationData {
  organizationId: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  feature: AIFeatureValue;
  title?: string;
  provider: AIProviderValue;
  model: string;
  metadata?: Record<string, unknown>;
}

export interface CreateMessageData {
  organizationId: string;
  conversationId: string;
  userId?: string;
  parentMessageId?: string;
  role: AIMessageRoleValue;
  content: string;
  provider?: AIProviderValue;
  model?: string;
  citations?: unknown;
  safetyMetadata?: unknown;
  finishReason?: string;
  tokenPrompt?: number;
  tokenCompletion?: number;
  latencyMs?: number;
}

export interface CreateUsageData {
  organizationId: string;
  userId?: string;
  conversationId?: string;
  messageId?: string;
  jobId?: string;
  provider: AIProviderValue;
  model: string;
  modelType: 'CHAT' | 'EMBEDDING' | 'MODERATION';
  usageType: 'CHAT_COMPLETION' | 'EMBEDDING' | 'MODERATION' | 'STRUCTURED_GENERATION' | 'RESERVATION';
  feature: AIFeatureValue;
  status?: 'RESERVED' | 'COMMITTED' | 'RELEASED' | 'FAILED';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reservedTokens?: number;
  costMicros?: bigint;
  latencyMs?: number;
  success?: boolean;
  errorCode?: string;
  requestId: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface EnqueueAIJobData {
  organizationId: string;
  requestedById?: string;
  documentId?: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  conversationId?: string;
  type: string;
  priority?: number;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
  correlationId?: string;
}

export interface CreateDocumentData {
  organizationId: string;
  createdById?: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  mediaAssetId?: string;
  sourceType: string;
  sourceKey: string;
  title: string;
  extractedText?: string;
  checksumSha256?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface UpsertFeedbackData {
  organizationId: string;
  messageId: string;
  userId: string;
  rating: AIFeedbackRatingValue;
  reason?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface AIRepository {
  readonly marker: 'ai-repository';

  createConversation(data: CreateConversationData): Promise<AIConversationRecord>;
  findConversation(
    organizationId: string,
    id: string,
    userId?: string,
  ): Promise<AIConversationRecord | null>;
  listConversations(input: {
    organizationId: string;
    userId: string;
    feature?: AIFeatureValue;
    search?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResult<AIConversationRecord>>;
  updateConversation(
    organizationId: string,
    id: string,
    userId: string,
    data: Partial<Pick<AIConversationRecord, 'title' | 'pinnedAt' | 'lastMessageAt' | 'metadata'>>,
  ): Promise<AIConversationRecord | null>;
  softDeleteConversation(organizationId: string, id: string, userId: string): Promise<boolean>;

  createMessage(data: CreateMessageData): Promise<AIMessageRecord>;
  listMessages(organizationId: string, conversationId: string): Promise<AIMessageRecord[]>;

  findActivePromptTemplate(
    key: string,
    feature: AIFeatureValue,
    locale?: string,
  ): Promise<AIPromptTemplateRecord | null>;

  createUsage(data: CreateUsageData): Promise<{ id: string }>;
  updateUsage(
    organizationId: string,
    usageId: string,
    data: {
      status: 'RESERVED' | 'COMMITTED' | 'RELEASED' | 'FAILED';
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      reservedTokens?: number;
      costMicros?: bigint;
      latencyMs?: number;
      success?: boolean;
      errorCode?: string;
      messageId?: string;
      conversationId?: string;
    },
  ): Promise<void>;
  sumUsageTokens(input: {
    organizationId: string;
    userId?: string;
    since: Date;
  }): Promise<AIUsageTotals>;

  createDocument(data: CreateDocumentData): Promise<AIDocumentRecord>;
  updateDocument(
    organizationId: string,
    id: string,
    data: Partial<
      Pick<
        AIDocumentRecord,
        | 'status'
        | 'extractedText'
        | 'chunkCount'
        | 'tokenCount'
        | 'errorCode'
        | 'errorMessage'
        | 'checksumSha256'
      >
    >,
  ): Promise<AIDocumentRecord | null>;
  findDocument(organizationId: string, id: string): Promise<AIDocumentRecord | null>;
  listDocuments(input: {
    organizationId: string;
    courseId?: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResult<AIDocumentRecord>>;

  deleteEmbeddingsForDocument(documentId: string): Promise<void>;
  insertEmbeddingBatch(input: {
    organizationId: string;
    documentId: string;
    provider: AIProviderValue;
    model: string;
    chunks: {
      chunkIndex: number;
      content: string;
      tokenCount: number;
      embedding: number[];
      startOffset?: number;
      endOffset?: number;
      pageNumber?: number;
      metadata?: Record<string, unknown>;
    }[];
  }): Promise<void>;
  searchEmbeddings(input: {
    organizationId: string;
    queryEmbedding: number[];
    topK: number;
    courseId?: string;
    lessonId?: string;
  }): Promise<RetrievalHit[]>;

  enqueueJob(data: EnqueueAIJobData): Promise<{ created: boolean; job: AIJobRecord }>;
  claimNextJobBatch(workerId: string, batchSize: number, now: Date): Promise<AIJobRecord[]>;
  recoverStuckJobs(lockedBefore: Date): Promise<number>;
  markJobCompleted(
    organizationId: string,
    jobId: string,
    result: Record<string, unknown>,
    resultMessageId?: string,
  ): Promise<void>;
  markJobFailed(
    organizationId: string,
    jobId: string,
    errorCode: string,
    errorMessage: string,
    availableAt: Date,
  ): Promise<void>;
  markJobDeadLetter(
    organizationId: string,
    jobId: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void>;

  upsertFeedback(data: UpsertFeedbackData): Promise<void>;

  tryAdvisoryLock(lockKey: string): Promise<boolean>;
  releaseAdvisoryLock(lockKey: string): Promise<void>;

  getAdminUsageSummary(organizationId: string, since: Date): Promise<{
    totalTokens: number;
    totalRequests: number;
    byFeature: { feature: string; totalTokens: number; requests: number }[];
    byProvider: { provider: string; totalTokens: number; requests: number }[];
  }>;
}
