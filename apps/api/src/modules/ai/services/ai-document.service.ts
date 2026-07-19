import { createHash, randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { StorageService } from '../../storage/services/storage.service';
import {
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_EMBEDDING_MODEL,
} from '../constants/ai.constants';
import { AI_EMBEDDING_PROVIDER, AI_REPOSITORY } from '../constants/injection-tokens';
import type { AIProvider } from '../providers/ai-provider.interface';
import type { AIRepository } from '../interfaces/ai-repository.interface';
import { AIUsageService } from './ai-usage.service';

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + chunkSize);
    chunks.push(normalized.slice(start, end));
    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  const normalizedMime = mimeType.toLowerCase();
  if (normalizedMime.startsWith('text/')) {
    return buffer.toString('utf8');
  }
  if (normalizedMime === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default as (
      data: Buffer,
    ) => Promise<{ text: string }>;
    const parsed = await pdfParse(buffer);
    return parsed.text ?? '';
  }
  throw new Error(`Unsupported MIME type for AI indexing: ${mimeType}`);
}

@Injectable()
export class AIDocumentService {
  private readonly logger = new Logger(AIDocumentService.name);

  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
    @Inject(AI_EMBEDDING_PROVIDER)
    private readonly embeddingProvider: AIProvider,
    private readonly storage: StorageService,
    private readonly usage: AIUsageService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async indexMediaAsset(input: {
    organizationId: string;
    requestedById: string;
    mediaAssetId: string;
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
    title?: string;
  }) {
    const lockKey = `ai-index:${input.organizationId}:${input.mediaAssetId}`;
    const locked = await this.repository.tryAdvisoryLock(lockKey);
    if (!locked) {
      await this.repository.enqueueJob({
        organizationId: input.organizationId,
        requestedById: input.requestedById,
        type: 'EMBED_DOCUMENT',
        payload: { mediaAssetId: input.mediaAssetId },
        idempotencyKey: `embed:${input.mediaAssetId}`,
      });
      const existing = await this.repository.listDocuments({
        organizationId: input.organizationId,
        page: 1,
        limit: 1,
      });
      if (existing.items[0]) return existing.items[0];
      return this.repository.createDocument({
        organizationId: input.organizationId,
        createdById: input.requestedById,
        courseId: input.courseId,
        lessonId: input.lessonId,
        assignmentId: input.assignmentId,
        mediaAssetId: input.mediaAssetId,
        sourceType: 'MEDIA_ASSET',
        sourceKey: input.mediaAssetId,
        title: input.title ?? input.mediaAssetId,
      });
    }

    try {
      const downloaded = await this.storage.downloadAuthorizedAsset({
        organizationId: input.organizationId,
        assetId: input.mediaAssetId,
        allowedEntityTypes: [
          'LESSON_PDF',
          'LESSON_ATTACHMENT',
          'ASSIGNMENT_ATTACHMENT',
          'OTHER',
        ],
        allowedMimePrefixes: ['text/', 'application/pdf'],
      });
      const extractedText = await extractTextFromBuffer(
        downloaded.buffer,
        downloaded.mimeType,
      );
      const checksum = createHash('sha256').update(downloaded.buffer).digest('hex');
      const document = await this.repository.createDocument({
        organizationId: input.organizationId,
        createdById: input.requestedById,
        courseId: input.courseId,
        lessonId: input.lessonId,
        assignmentId: input.assignmentId,
        mediaAssetId: input.mediaAssetId,
        sourceType: 'MEDIA_ASSET',
        sourceKey: input.mediaAssetId,
        title: input.title ?? downloaded.asset.originalFilename,
        extractedText,
        checksumSha256: checksum,
      });
      await this.repository.updateDocument(input.organizationId, document.id, {
        status: 'PROCESSING',
      });
      await this.embedDocument(document.id, input.organizationId, input.requestedById);
      return document;
    } finally {
      await this.repository.releaseAdvisoryLock(lockKey);
    }
  }

  async embedDocument(documentId: string, organizationId: string, userId?: string) {
    const document = await this.repository.findDocument(organizationId, documentId);
    if (!document?.extractedText) {
      await this.repository.updateDocument(organizationId, documentId, {
        status: 'FAILED',
        errorCode: 'EMPTY_DOCUMENT',
        errorMessage: 'No extractable text was found.',
      });
      return;
    }
    const chunkSize = this.config.get('AI_CHUNK_SIZE', { infer: true }) ?? DEFAULT_CHUNK_SIZE;
    const overlap = this.config.get('AI_CHUNK_OVERLAP', { infer: true }) ?? DEFAULT_CHUNK_OVERLAP;
    const chunks = chunkText(document.extractedText, chunkSize, overlap);
    const model =
      this.config.get('EMBEDDING_MODEL', { infer: true }) ?? DEFAULT_EMBEDDING_MODEL;

    await this.repository.deleteEmbeddingsForDocument(documentId);
    const batchSize = 16;
    let tokenCount = 0;
    for (let offset = 0; offset < chunks.length; offset += batchSize) {
      const slice = chunks.slice(offset, offset + batchSize);
      const embedResult = await this.embeddingProvider.embed({ model, input: slice });
      await this.usage.recordEmbeddingUsage({
        organizationId,
        userId,
        provider: embedResult.provider,
        model: embedResult.model,
        feature: 'SEMANTIC_SEARCH',
        usage: embedResult.usage,
      });
      tokenCount += slice.reduce((sum, chunk) => sum + Math.ceil(chunk.length / 4), 0);
      await this.repository.insertEmbeddingBatch({
        organizationId,
        documentId,
        provider: embedResult.provider,
        model: embedResult.model,
        chunks: slice.map((content, index) => ({
          chunkIndex: offset + index,
          content,
          tokenCount: Math.ceil(content.length / 4),
          embedding: embedResult.embeddings[index] ?? [],
        })),
      });
    }
    await this.repository.updateDocument(organizationId, documentId, {
      status: 'READY',
      chunkCount: chunks.length,
      tokenCount,
      errorCode: null,
      errorMessage: null,
    });
  }

  enqueueReindex(documentId: string, organizationId: string, requestedById: string) {
    return this.repository.enqueueJob({
      organizationId,
      requestedById,
      documentId,
      type: 'REINDEX_DOCUMENT',
      idempotencyKey: `reindex:${documentId}:${randomUUID()}`,
    });
  }
}
