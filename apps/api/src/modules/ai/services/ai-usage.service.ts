import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AIFeatureValue, AIProviderValue } from '../constants/ai.constants';
import { AI_REPOSITORY } from '../constants/injection-tokens';
import type { AIUsageMetrics } from '../providers/ai-provider.interface';
import type { AIRepository } from '../interfaces/ai-repository.interface';

@Injectable()
export class AIUsageService {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
  ) {}

  recordChatUsage(input: {
    organizationId: string;
    userId: string;
    conversationId: string;
    messageId: string;
    provider: AIProviderValue;
    model: string;
    feature: AIFeatureValue;
    usage: AIUsageMetrics;
    latencyMs?: number;
    correlationId?: string;
  }): Promise<{ id: string }> {
    return this.repository.createUsage({
      organizationId: input.organizationId,
      userId: input.userId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      provider: input.provider,
      model: input.model,
      modelType: 'CHAT',
      usageType: 'CHAT_COMPLETION',
      feature: input.feature,
      promptTokens: input.usage.promptTokens,
      completionTokens: input.usage.completionTokens,
      totalTokens: input.usage.totalTokens,
      latencyMs: input.latencyMs,
      requestId: randomUUID(),
      correlationId: input.correlationId,
    });
  }

  recordEmbeddingUsage(input: {
    organizationId: string;
    userId?: string;
    provider: AIProviderValue;
    model: string;
    feature: AIFeatureValue;
    usage: AIUsageMetrics;
    jobId?: string;
  }): Promise<{ id: string }> {
    return this.repository.createUsage({
      organizationId: input.organizationId,
      userId: input.userId,
      jobId: input.jobId,
      provider: input.provider,
      model: input.model,
      modelType: 'EMBEDDING',
      usageType: 'EMBEDDING',
      feature: input.feature,
      promptTokens: input.usage.promptTokens,
      completionTokens: input.usage.completionTokens,
      totalTokens: input.usage.totalTokens,
      requestId: randomUUID(),
    });
  }
}
