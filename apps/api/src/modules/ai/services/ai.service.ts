import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { EnvConfig } from '../../../config/env.schema';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import type { AIFeatureValue } from '../constants/ai.constants';
import { AI_CHAT_PROVIDER, AI_REPOSITORY } from '../constants/injection-tokens';
import {
  AIConversationNotFoundException,
  AISandboxForbiddenException,
} from '../exceptions';
import type { AIProvider } from '../providers/ai-provider.interface';
import type { AIRepository } from '../interfaces/ai-repository.interface';
import { AIPromptService } from './ai-prompt.service';
import { AIQuotaService } from './ai-quota.service';
import { AIRetrievalService } from './ai-retrieval.service';
import { AISafetyService } from './ai-safety.service';
import { assertAIOrganizationAccess } from '../utils/ai-org-access';

function writeSse(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

@Injectable()
export class AIService {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
    @Inject(AI_CHAT_PROVIDER)
    private readonly chatProvider: AIProvider,
    private readonly prompt: AIPromptService,
    private readonly quota: AIQuotaService,
    private readonly safety: AISafetyService,
    private readonly retrieval: AIRetrievalService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async streamChat(
    user: AuthenticatedUser,
    res: Response,
    input: {
      organizationId: string;
      conversationId?: string;
      feature: AIFeatureValue;
      message: string;
      courseId?: string;
      lessonId?: string;
      assignmentId?: string;
      parentMessageId?: string;
    },
    abortSignal?: AbortSignal,
  ): Promise<void> {
    assertAIOrganizationAccess(user, input.organizationId);
    if (this.chatProvider.name === 'SANDBOX') {
      throw new AISandboxForbiddenException();
    }
    this.safety.validateUserInput(input.message);

    const model = this.config.get('OPENAI_MODEL', { infer: true });
    const estimatedTokens = this.quota.estimateTokens(input.message) + 1200;
    const { reservationId } = await this.quota.reserve({
      organizationId: input.organizationId,
      userId: user.id,
      estimatedTokens,
      provider: this.chatProvider.name,
      model,
      feature: input.feature,
      conversationId: input.conversationId,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let conversationId = input.conversationId;
    try {
      if (!conversationId) {
        const created = await this.repository.createConversation({
          organizationId: input.organizationId,
          userId: user.id,
          feature: input.feature,
          courseId: input.courseId,
          lessonId: input.lessonId,
          assignmentId: input.assignmentId,
          provider: this.chatProvider.name,
          model,
          title: input.message.slice(0, 80),
        });
        conversationId = created.id;
      } else {
        const existing = await this.repository.findConversation(
          input.organizationId,
          conversationId,
          user.id,
        );
        if (!existing) throw new AIConversationNotFoundException();
      }

      writeSse(res, 'start', { conversationId });

      const userMessage = await this.repository.createMessage({
        organizationId: input.organizationId,
        conversationId,
        userId: user.id,
        parentMessageId: input.parentMessageId,
        role: 'USER',
        content: input.message,
      });
      writeSse(res, 'userMessage', { id: userMessage.id });

      const template = await this.prompt.resolveTemplate({ feature: input.feature });
      const hits = await this.retrieval.search({
        organizationId: input.organizationId,
        userId: user.id,
        query: input.message,
        courseId: input.courseId,
        lessonId: input.lessonId,
      });
      const citations = this.retrieval.formatCitations(hits);
      if (citations.length > 0) {
        writeSse(res, 'citation', { citations });
      }

      const history = await this.repository.listMessages(input.organizationId, conversationId);
      const messages = [
        { role: 'system' as const, content: template.systemPrompt },
        ...(hits.length
          ? [
              {
                role: 'system' as const,
                content: `Use only the following retrieved sources when relevant:\n${this.retrieval.buildContextBlock(hits)}`,
              },
            ]
          : []),
        ...history
          .filter((entry) => entry.id !== userMessage.id)
          .slice(-12)
          .map((entry) => ({
            role:
              entry.role === 'ASSISTANT'
                ? ('assistant' as const)
                : entry.role === 'SYSTEM'
                  ? ('system' as const)
                  : ('user' as const),
            content: entry.content,
          })),
        { role: 'user' as const, content: input.message },
      ];

      let content = '';
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      let finishReason: string | null = null;
      const started = Date.now();

      for await (const chunk of this.chatProvider.chatStream({
        model,
        messages,
        maxTokens: 4096,
        abortSignal,
      })) {
        if (abortSignal?.aborted) {
          throw new Error('Client disconnected.');
        }
        if (chunk.type === 'token' && chunk.delta) {
          content += chunk.delta;
          writeSse(res, 'token', { delta: chunk.delta });
        }
        if (chunk.usage) usage = chunk.usage;
        if (chunk.finishReason) finishReason = chunk.finishReason;
        if (chunk.type === 'error') {
          writeSse(res, 'error', { message: chunk.error ?? 'Generation failed.' });
          await this.quota.releaseReservation({
            organizationId: input.organizationId,
            reservationId,
            errorCode: 'PROVIDER_ERROR',
          });
          res.end();
          return;
        }
      }

      content = this.safety.sanitizeOutput(content);
      const assistantMessage = await this.repository.createMessage({
        organizationId: input.organizationId,
        conversationId,
        role: 'ASSISTANT',
        content,
        provider: this.chatProvider.name,
        model,
        citations,
        finishReason: finishReason ?? undefined,
        tokenPrompt: usage.promptTokens,
        tokenCompletion: usage.completionTokens,
        latencyMs: Date.now() - started,
      });
      await this.quota.commitReservation({
        organizationId: input.organizationId,
        reservationId,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens || usage.promptTokens + usage.completionTokens,
        latencyMs: Date.now() - started,
        messageId: assistantMessage.id,
        conversationId,
      });
      await this.repository.updateConversation(input.organizationId, conversationId, user.id, {
        lastMessageAt: new Date(),
      });
      writeSse(res, 'usage', usage);
      writeSse(res, 'done', {
        conversationId,
        messageId: assistantMessage.id,
        finishReason,
      });
      res.end();
    } catch (error: unknown) {
      await this.quota.releaseReservation({
        organizationId: input.organizationId,
        reservationId,
        errorCode: abortSignal?.aborted ? 'CLIENT_ABORT' : 'GENERATION_FAILED',
      });
      if (!res.writableEnded) {
        writeSse(res, 'error', {
          message: error instanceof Error ? error.message : 'Generation failed.',
        });
        res.end();
      }
    }
  }

  async submitFeedback(
    user: AuthenticatedUser,
    organizationId: string,
    messageId: string,
    input: { rating: 'UP' | 'DOWN'; reason?: string; comment?: string },
  ) {
    assertAIOrganizationAccess(user, organizationId);
    await this.repository.upsertFeedback({
      organizationId,
      messageId,
      userId: user.id,
      rating: input.rating,
      reason: input.reason,
      comment: input.comment,
    });
    return { saved: true };
  }

  providerHealth() {
    return this.chatProvider.health().then((health) => ({
      provider: this.chatProvider.name,
      configured: this.chatProvider.isConfigured(),
      healthy: health.healthy,
      latencyMs: health.latencyMs,
      message: health.message,
    }));
  }

  getQuota(user: AuthenticatedUser, organizationId: string) {
    assertAIOrganizationAccess(user, organizationId);
    return this.quota.getQuotaSnapshot({ organizationId, userId: user.id });
  }
}
