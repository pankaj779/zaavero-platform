import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { randomUUID } from 'node:crypto';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  AIRepository,
  AIConversationRecord,
  AIMessageRecord,
  AIPromptTemplateRecord,
  AIDocumentRecord,
  AIJobRecord,
  CreateConversationData,
  CreateDocumentData,
  CreateMessageData,
  CreateUsageData,
  EnqueueAIJobData,
  PaginatedResult,
  RetrievalHit,
  UpsertFeedbackData,
} from '../interfaces/ai-repository.interface';

const conversationSelect = {
  id: true,
  organizationId: true,
  userId: true,
  courseId: true,
  lessonId: true,
  assignmentId: true,
  feature: true,
  title: true,
  provider: true,
  model: true,
  pinnedAt: true,
  lastMessageAt: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

const messageSelect = {
  id: true,
  organizationId: true,
  conversationId: true,
  userId: true,
  parentMessageId: true,
  role: true,
  content: true,
  provider: true,
  model: true,
  citations: true,
  safetyMetadata: true,
  finishReason: true,
  tokenPrompt: true,
  tokenCompletion: true,
  latencyMs: true,
  createdAt: true,
  deletedAt: true,
} as const;

const documentSelect = {
  id: true,
  organizationId: true,
  createdById: true,
  courseId: true,
  lessonId: true,
  assignmentId: true,
  mediaAssetId: true,
  sourceType: true,
  sourceKey: true,
  title: true,
  extractedText: true,
  checksumSha256: true,
  version: true,
  status: true,
  language: true,
  chunkCount: true,
  tokenCount: true,
  errorCode: true,
  errorMessage: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

const jobSelect = {
  id: true,
  organizationId: true,
  requestedById: true,
  documentId: true,
  courseId: true,
  lessonId: true,
  assignmentId: true,
  conversationId: true,
  resultMessageId: true,
  type: true,
  status: true,
  priority: true,
  payload: true,
  result: true,
  availableAt: true,
  lockedAt: true,
  lockedBy: true,
  processedAt: true,
  attempts: true,
  maxAttempts: true,
  backoffSeconds: true,
  lastErrorCode: true,
  lastErrorMessage: true,
  idempotencyKey: true,
  correlationId: true,
  createdAt: true,
  updatedAt: true,
} as const;

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

function vectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}

@Injectable()
export class PrismaAIRepository implements AIRepository {
  readonly marker = 'ai-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  createConversation(data: CreateConversationData): Promise<AIConversationRecord> {
    return this.prisma.aIConversation.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        courseId: data.courseId,
        lessonId: data.lessonId,
        assignmentId: data.assignmentId,
        feature: data.feature,
        title: data.title,
        provider: data.provider,
        model: data.model,
        metadata: data.metadata as never,
      },
      select: conversationSelect,
    });
  }

  findConversation(
    organizationId: string,
    id: string,
    userId?: string,
  ): Promise<AIConversationRecord | null> {
    return this.prisma.aIConversation.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
        ...(userId ? { userId } : {}),
      },
      select: conversationSelect,
    });
  }

  async listConversations(input: {
    organizationId: string;
    userId: string;
    feature?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResult<AIConversationRecord>> {
    const where = {
      organizationId: input.organizationId,
      userId: input.userId,
      deletedAt: null,
      ...(input.feature ? { feature: input.feature as never } : {}),
      ...(input.search
        ? { title: { contains: input.search, mode: 'insensitive' as const } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.aIConversation.findMany({
        where,
        select: conversationSelect,
        orderBy: [{ pinnedAt: 'desc' }, { updatedAt: 'desc' }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.prisma.aIConversation.count({ where }),
    ]);
    return { items: items, total };
  }

  updateConversation(
    organizationId: string,
    id: string,
    userId: string,
    data: Partial<{ title: string | null; pinnedAt: Date | null; lastMessageAt: Date | null; metadata: unknown }>,
  ): Promise<AIConversationRecord | null> {
    return this.prisma.aIConversation.updateMany({
      where: { id, organizationId, userId, deletedAt: null },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.pinnedAt !== undefined ? { pinnedAt: data.pinnedAt } : {}),
        ...(data.lastMessageAt !== undefined ? { lastMessageAt: data.lastMessageAt } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata as never } : {}),
      },
    }).then(async (result) => {
      if (result.count === 0) return null;
      return this.findConversation(organizationId, id, userId);
    });
  }

  async softDeleteConversation(organizationId: string, id: string, userId: string) {
    const result = await this.prisma.aIConversation.updateMany({
      where: { id, organizationId, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }

  createMessage(data: CreateMessageData): Promise<AIMessageRecord> {
    return this.prisma.aIMessage.create({
      data: {
        organizationId: data.organizationId,
        conversationId: data.conversationId,
        userId: data.userId,
        parentMessageId: data.parentMessageId,
        role: data.role,
        content: data.content,
        provider: data.provider,
        model: data.model,
        citations: data.citations as never,
        safetyMetadata: data.safetyMetadata as never,
        finishReason: data.finishReason,
        tokenPrompt: data.tokenPrompt ?? 0,
        tokenCompletion: data.tokenCompletion ?? 0,
        latencyMs: data.latencyMs,
      },
      select: messageSelect,
    });
  }

  listMessages(organizationId: string, conversationId: string): Promise<AIMessageRecord[]> {
    return this.prisma.aIMessage.findMany({
      where: { organizationId, conversationId, deletedAt: null },
      select: messageSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  findActivePromptTemplate(
    key: string,
    feature: string,
    locale = 'en',
  ): Promise<AIPromptTemplateRecord | null> {
    return this.prisma.aIPromptTemplate.findFirst({
      where: {
        scopeKey: 'system',
        key,
        locale,
        feature: feature as never,
        status: 'ACTIVE',
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        scopeKey: true,
        key: true,
        locale: true,
        version: true,
        feature: true,
        title: true,
        systemPrompt: true,
        userTemplate: true,
        variableSchema: true,
      },
    });
  }

  async createUsage(data: CreateUsageData): Promise<{ id: string }> {
    const created = await this.prisma.aIUsage.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        conversationId: data.conversationId,
        messageId: data.messageId,
        jobId: data.jobId,
        provider: data.provider,
        model: data.model,
        modelType: data.modelType,
        usageType: data.usageType,
        feature: data.feature,
        status: data.status ?? 'COMMITTED',
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        reservedTokens: data.reservedTokens ?? 0,
        costMicros: data.costMicros ?? 0n,
        latencyMs: data.latencyMs,
        success: data.success ?? true,
        errorCode: data.errorCode,
        requestId: data.requestId,
        correlationId: data.correlationId,
        metadata: data.metadata as never,
      },
      select: { id: true },
    });
    return { id: created.id };
  }

  async updateUsage(
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
  ): Promise<void> {
    await this.prisma.aIUsage.updateMany({
      where: { id: usageId, organizationId },
      data: {
        status: data.status,
        ...(data.promptTokens !== undefined ? { promptTokens: data.promptTokens } : {}),
        ...(data.completionTokens !== undefined
          ? { completionTokens: data.completionTokens }
          : {}),
        ...(data.totalTokens !== undefined ? { totalTokens: data.totalTokens } : {}),
        ...(data.reservedTokens !== undefined ? { reservedTokens: data.reservedTokens } : {}),
        ...(data.costMicros !== undefined ? { costMicros: data.costMicros } : {}),
        ...(data.latencyMs !== undefined ? { latencyMs: data.latencyMs } : {}),
        ...(data.success !== undefined ? { success: data.success } : {}),
        ...(data.errorCode !== undefined ? { errorCode: data.errorCode } : {}),
        ...(data.messageId !== undefined ? { messageId: data.messageId } : {}),
        ...(data.conversationId !== undefined ? { conversationId: data.conversationId } : {}),
      },
    });
  }

  async sumUsageTokens(input: { organizationId: string; userId?: string; since: Date }) {
    const aggregate = await this.prisma.aIUsage.aggregate({
      where: {
        organizationId: input.organizationId,
        ...(input.userId ? { userId: input.userId } : {}),
        createdAt: { gte: input.since },
        status: { in: ['COMMITTED', 'RESERVED'] },
      },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
    });
    return {
      promptTokens: aggregate._sum.promptTokens ?? 0,
      completionTokens: aggregate._sum.completionTokens ?? 0,
      totalTokens: aggregate._sum.totalTokens ?? 0,
    };
  }

  createDocument(data: CreateDocumentData): Promise<AIDocumentRecord> {
    return this.prisma.aIDocument.create({
      data: {
        organizationId: data.organizationId,
        createdById: data.createdById,
        courseId: data.courseId,
        lessonId: data.lessonId,
        assignmentId: data.assignmentId,
        mediaAssetId: data.mediaAssetId,
        sourceType: data.sourceType as never,
        sourceKey: data.sourceKey,
        title: data.title,
        extractedText: data.extractedText,
        checksumSha256: data.checksumSha256,
        language: data.language ?? 'en',
        metadata: data.metadata as never,
      },
      select: documentSelect,
    });
  }

  updateDocument(
    organizationId: string,
    id: string,
    data: Partial<{
      status: string;
      extractedText: string | null;
      chunkCount: number;
      tokenCount: number;
      errorCode: string | null;
      errorMessage: string | null;
      checksumSha256: string | null;
    }>,
  ): Promise<AIDocumentRecord | null> {
    return this.prisma.aIDocument.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: {
        ...(data.status !== undefined ? { status: data.status as never } : {}),
        ...(data.extractedText !== undefined ? { extractedText: data.extractedText } : {}),
        ...(data.chunkCount !== undefined ? { chunkCount: data.chunkCount } : {}),
        ...(data.tokenCount !== undefined ? { tokenCount: data.tokenCount } : {}),
        ...(data.errorCode !== undefined ? { errorCode: data.errorCode } : {}),
        ...(data.errorMessage !== undefined ? { errorMessage: data.errorMessage } : {}),
        ...(data.checksumSha256 !== undefined ? { checksumSha256: data.checksumSha256 } : {}),
      },
    }).then(async (result) => {
      if (result.count === 0) return null;
      return this.findDocument(organizationId, id);
    });
  }

  findDocument(organizationId: string, id: string): Promise<AIDocumentRecord | null> {
    return this.prisma.aIDocument.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: documentSelect,
    });
  }

  async listDocuments(input: {
    organizationId: string;
    courseId?: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResult<AIDocumentRecord>> {
    const where = {
      organizationId: input.organizationId,
      deletedAt: null,
      ...(input.courseId ? { courseId: input.courseId } : {}),
      ...(input.status ? { status: input.status as never } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.aIDocument.findMany({
        where,
        select: documentSelect,
        orderBy: { updatedAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.prisma.aIDocument.count({ where }),
    ]);
    return { items: items, total };
  }

  deleteEmbeddingsForDocument(documentId: string) {
    return this.prisma.aIEmbedding.deleteMany({ where: { documentId } }).then(() => undefined);
  }

  async insertEmbeddingBatch(input: {
    organizationId: string;
    documentId: string;
    provider: string;
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
  }) {
    for (const chunk of input.chunks) {
      const id = randomUUID();
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO ai_embeddings (
          id, organization_id, document_id, chunk_index, content, token_count,
          start_offset, end_offset, page_number, provider, model, embedding, metadata
        ) VALUES (
          $1::uuid, $2::uuid, $3::uuid, $4, $5, $6,
          $7, $8, $9, $10::ai_provider, $11, $12::vector, $13::jsonb
        )`,
        id,
        input.organizationId,
        input.documentId,
        chunk.chunkIndex,
        chunk.content,
        chunk.tokenCount,
        chunk.startOffset ?? null,
        chunk.endOffset ?? null,
        chunk.pageNumber ?? null,
        input.provider,
        input.model,
        vectorLiteral(chunk.embedding),
        JSON.stringify(chunk.metadata ?? {}),
      );
    }
  }

  async searchEmbeddings(input: {
    organizationId: string;
    queryEmbedding: number[];
    topK: number;
    courseId?: string;
    lessonId?: string;
  }): Promise<RetrievalHit[]> {
    const rows = await this.prisma.$queryRawUnsafe<
      {
        embedding_id: string;
        document_id: string;
        chunk_index: number;
        content: string;
        title: string;
        source_type: string;
        course_id: string | null;
        lesson_id: string | null;
        score: number;
      }[]
    >(
      `SELECT
         e.id AS embedding_id,
         e.document_id,
         e.chunk_index,
         e.content,
         d.title,
         d.source_type,
         d.course_id,
         d.lesson_id,
         1 - (e.embedding <=> $1::vector) AS score
       FROM ai_embeddings e
       INNER JOIN ai_documents d ON d.id = e.document_id
       WHERE e.organization_id = $2::uuid
         AND d.deleted_at IS NULL
         AND d.status = 'READY'::ai_document_status
         AND ($3::uuid IS NULL OR d.course_id = $3::uuid)
         AND ($4::uuid IS NULL OR d.lesson_id = $4::uuid)
       ORDER BY e.embedding <=> $1::vector
       LIMIT $5`,
      vectorLiteral(input.queryEmbedding),
      input.organizationId,
      input.courseId ?? null,
      input.lessonId ?? null,
      input.topK,
    );
    return rows.map((row) => ({
      embeddingId: row.embedding_id,
      documentId: row.document_id,
      chunkIndex: row.chunk_index,
      content: row.content,
      title: row.title,
      score: row.score,
      sourceType: row.source_type,
      courseId: row.course_id,
      lessonId: row.lesson_id,
    }));
  }

  async enqueueJob(data: EnqueueAIJobData): Promise<{ created: boolean; job: AIJobRecord }> {
    try {
      const job = await this.prisma.aIJob.create({
        data: {
          organizationId: data.organizationId,
          requestedById: data.requestedById,
          documentId: data.documentId,
          courseId: data.courseId,
          lessonId: data.lessonId,
          assignmentId: data.assignmentId,
          conversationId: data.conversationId,
          type: data.type as never,
          priority: data.priority ?? 0,
          payload: data.payload as never,
          idempotencyKey: data.idempotencyKey,
          correlationId: data.correlationId,
        },
        select: jobSelect,
      });
      return { created: true, job: job };
    } catch (error: unknown) {
      if (!isUniqueConflict(error)) throw error;
      const job = await this.prisma.aIJob.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: data.organizationId,
            idempotencyKey: data.idempotencyKey,
          },
        },
        select: jobSelect,
      });
      if (!job) throw error;
      return { created: false, job: job };
    }
  }

  async claimNextJobBatch(workerId: string, batchSize: number, now: Date): Promise<AIJobRecord[]> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM ai_jobs
         WHERE status IN ('QUEUED'::ai_job_status, 'FAILED'::ai_job_status)
           AND available_at <= $1
         ORDER BY priority DESC, available_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $2`,
        now,
        batchSize,
      );
      const ids = rows.map(({ id }) => id);
      if (ids.length === 0) return [];
      await tx.aIJob.updateMany({
        where: { id: { in: ids }, status: { in: ['QUEUED', 'FAILED'] } },
        data: {
          status: 'PROCESSING',
          lockedAt: now,
          lockedBy: workerId,
          attempts: { increment: 1 },
        },
      });
      return tx.aIJob.findMany({
        where: { id: { in: ids }, lockedBy: workerId, status: 'PROCESSING' },
        select: jobSelect,
        orderBy: [{ priority: 'desc' }, { availableAt: 'asc' }],
      });
    });
  }

  recoverStuckJobs(lockedBefore: Date) {
    return this.prisma.aIJob
      .updateMany({
        where: { status: 'PROCESSING', lockedAt: { lt: lockedBefore } },
        data: { status: 'QUEUED', lockedAt: null, lockedBy: null, availableAt: new Date() },
      })
      .then((result) => result.count);
  }

  markJobCompleted(
    organizationId: string,
    jobId: string,
    result: Record<string, unknown>,
    resultMessageId?: string,
  ) {
    return this.prisma.aIJob.updateMany({
      where: { id: jobId, organizationId, status: 'PROCESSING' },
      data: {
        status: 'COMPLETED',
        result: result as never,
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        resultMessageId,
      },
    }).then(() => undefined);
  }

  markJobFailed(
    organizationId: string,
    jobId: string,
    errorCode: string,
    errorMessage: string,
    availableAt: Date,
  ) {
    return this.prisma.aIJob.updateMany({
      where: { id: jobId, organizationId, status: 'PROCESSING' },
      data: {
        status: 'FAILED',
        availableAt,
        lockedAt: null,
        lockedBy: null,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
      },
    }).then(() => undefined);
  }

  markJobDeadLetter(
    organizationId: string,
    jobId: string,
    errorCode: string,
    errorMessage: string,
  ) {
    return this.prisma.aIJob.updateMany({
      where: { id: jobId, organizationId, status: 'PROCESSING' },
      data: {
        status: 'DEAD_LETTER',
        deadLetteredAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
      },
    }).then(() => undefined);
  }

  upsertFeedback(data: UpsertFeedbackData) {
    return this.prisma.aIFeedback
      .upsert({
        where: { messageId_userId: { messageId: data.messageId, userId: data.userId } },
        update: {
          rating: data.rating,
          reason: data.reason,
          comment: data.comment,
          metadata: data.metadata as never,
        },
        create: {
          organizationId: data.organizationId,
          messageId: data.messageId,
          userId: data.userId,
          rating: data.rating,
          reason: data.reason,
          comment: data.comment,
          metadata: data.metadata as never,
        },
      })
      .then(() => undefined);
  }

  async tryAdvisoryLock(lockKey: string) {
    const rows = await this.prisma.$queryRawUnsafe<{ locked: boolean }[]>(
      `SELECT pg_try_advisory_lock(hashtext($1)) AS locked`,
      lockKey,
    );
    return Boolean(rows[0]?.locked);
  }

  releaseAdvisoryLock(lockKey: string) {
    return this.prisma
      .$executeRawUnsafe(`SELECT pg_advisory_unlock(hashtext($1))`, lockKey)
      .then(() => undefined);
  }

  async getAdminUsageSummary(
    organizationId: string,
    since: Date,
  ): Promise<{
    totalTokens: number;
    totalRequests: number;
    byFeature: { feature: string; totalTokens: number; requests: number }[];
    byProvider: { provider: string; totalTokens: number; requests: number }[];
  }> {
    const [totals, byFeature, byProvider] = await Promise.all([
      this.prisma.aIUsage.aggregate({
        where: { organizationId, createdAt: { gte: since }, status: 'COMMITTED' },
        _sum: { totalTokens: true },
        _count: { _all: true },
      }),
      this.prisma.aIUsage.groupBy({
        by: ['feature'],
        where: { organizationId, createdAt: { gte: since }, status: 'COMMITTED' },
        _sum: { totalTokens: true },
        _count: { _all: true },
      }),
      this.prisma.aIUsage.groupBy({
        by: ['provider'],
        where: { organizationId, createdAt: { gte: since }, status: 'COMMITTED' },
        _sum: { totalTokens: true },
        _count: { _all: true },
      }),
    ]);
    return {
      totalTokens: totals._sum.totalTokens ?? 0,
      totalRequests: totals._count._all,
      byFeature: byFeature.map((row) => ({
        feature: row.feature,
        totalTokens: row._sum.totalTokens ?? 0,
        requests: row._count._all,
      })),
      byProvider: byProvider.map((row) => ({
        provider: row.provider,
        totalTokens: row._sum.totalTokens ?? 0,
        requests: row._count._all,
      })),
    };
  }
}
