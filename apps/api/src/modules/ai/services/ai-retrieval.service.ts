import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { DEFAULT_EMBEDDING_MODEL } from '../constants/ai.constants';
import { AI_EMBEDDING_PROVIDER } from '../constants/injection-tokens';
import type { AIProvider } from '../providers/ai-provider.interface';
import { AIUsageService } from './ai-usage.service';
import { AI_REPOSITORY } from '../constants/injection-tokens';
import type { AIRepository, RetrievalHit } from '../interfaces/ai-repository.interface';

@Injectable()
export class AIRetrievalService {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
    @Inject(AI_EMBEDDING_PROVIDER)
    private readonly embeddingProvider: AIProvider,
    private readonly usage: AIUsageService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async search(input: {
    organizationId: string;
    userId: string;
    query: string;
    courseId?: string;
    lessonId?: string;
  }): Promise<RetrievalHit[]> {
    const model =
      this.config.get('EMBEDDING_MODEL', { infer: true }) ?? DEFAULT_EMBEDDING_MODEL;
    const embedResult = await this.embeddingProvider.embed({
      model,
      input: input.query,
    });
    await this.usage.recordEmbeddingUsage({
      organizationId: input.organizationId,
      userId: input.userId,
      provider: embedResult.provider,
      model: embedResult.model,
      feature: 'SEMANTIC_SEARCH',
      usage: embedResult.usage,
    });
    const topK = this.config.get('AI_RETRIEVAL_TOP_K', { infer: true });
    return this.repository.searchEmbeddings({
      organizationId: input.organizationId,
      queryEmbedding: embedResult.embeddings[0] ?? [],
      topK,
      courseId: input.courseId,
      lessonId: input.lessonId,
    });
  }

  formatCitations(hits: RetrievalHit[]): Array<Record<string, unknown>> {
    return hits.map((hit) => ({
      documentId: hit.documentId,
      title: hit.title,
      chunkIndex: hit.chunkIndex,
      score: hit.score,
      sourceType: hit.sourceType,
      excerpt: hit.content.slice(0, 400),
    }));
  }

  buildContextBlock(hits: RetrievalHit[]): string {
    if (hits.length === 0) return '';
    return hits
      .map(
        (hit, index) =>
          `[Source ${index + 1}: ${hit.title}]\n${hit.content.slice(0, 1200)}`,
      )
      .join('\n\n');
  }
}
