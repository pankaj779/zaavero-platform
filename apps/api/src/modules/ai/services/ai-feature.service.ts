import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { EnvConfig } from '../../../config/env.schema';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import type { AIFeatureValue } from '../constants/ai.constants';
import { AI_CHAT_PROVIDER, AI_REPOSITORY } from '../constants/injection-tokens';
import { AISandboxForbiddenException } from '../exceptions';
import type { AIProvider } from '../providers/ai-provider.interface';
import type { AIRepository } from '../interfaces/ai-repository.interface';
import { AIPromptService } from './ai-prompt.service';
import { AIQuotaService } from './ai-quota.service';
import { AISafetyService } from './ai-safety.service';
import { AIUsageService } from './ai-usage.service';
import { assertAIOrganizationAccess } from '../utils/ai-org-access';

@Injectable()
export class AIFeatureService {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
    @Inject(AI_CHAT_PROVIDER)
    private readonly chatProvider: AIProvider,
    private readonly prompt: AIPromptService,
    private readonly quota: AIQuotaService,
    private readonly safety: AISafetyService,
    private readonly usage: AIUsageService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async generate(user: AuthenticatedUser, input: {
    organizationId: string;
    feature: AIFeatureValue;
    variables: Record<string, unknown>;
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
    conversationId?: string;
  }) {
    assertAIOrganizationAccess(user, input.organizationId);
    if (this.chatProvider.name === 'SANDBOX') {
      throw new AISandboxForbiddenException();
    }
    const userPrompt = JSON.stringify(input.variables);
    this.safety.validateUserInput(userPrompt);
    await this.quota.assertWithinLimits({
      organizationId: input.organizationId,
      userId: user.id,
      estimatedTokens: this.quota.estimateTokens(userPrompt) + 1500,
    });

    const template = await this.prompt.resolveTemplate({ feature: input.feature });
    const renderedUser = this.prompt.renderUserTemplate(template.userTemplate, input.variables);
    const model = this.config.get('OPENAI_MODEL', { infer: true });

    const result = await this.chatProvider.chat({
      model,
      messages: [
        { role: 'system', content: template.systemPrompt },
        ...(renderedUser ? [{ role: 'user' as const, content: renderedUser }] : []),
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 4096,
    });

    const content = this.safety.sanitizeOutput(result.content);
    let conversationId = input.conversationId;
    if (!conversationId) {
      const conversation = await this.repository.createConversation({
        organizationId: input.organizationId,
        userId: user.id,
        feature: input.feature,
        courseId: input.courseId,
        lessonId: input.lessonId,
        assignmentId: input.assignmentId,
        provider: result.provider,
        model: result.model,
        title: `${input.feature} ${new Date().toISOString()}`,
      });
      conversationId = conversation.id;
    }
    const assistantMessage = await this.repository.createMessage({
      organizationId: input.organizationId,
      conversationId,
      role: 'ASSISTANT',
      content,
      provider: result.provider,
      model: result.model,
      finishReason: result.finishReason ?? undefined,
      tokenPrompt: result.usage.promptTokens,
      tokenCompletion: result.usage.completionTokens,
      latencyMs: result.latencyMs,
    });
    await this.usage.recordChatUsage({
      organizationId: input.organizationId,
      userId: user.id,
      conversationId,
      messageId: assistantMessage.id,
      provider: result.provider,
      model: result.model,
      feature: input.feature,
      usage: result.usage,
      latencyMs: result.latencyMs,
    });
    await this.repository.updateConversation(input.organizationId, conversationId, user.id, {
      lastMessageAt: new Date(),
    });
    return {
      conversationId,
      messageId: assistantMessage.id,
      content,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    };
  }

  enqueueJob(user: AuthenticatedUser, input: {
    organizationId: string;
    type: string;
    feature: AIFeatureValue;
    payload: Record<string, unknown>;
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
  }) {
    assertAIOrganizationAccess(user, input.organizationId);
    return this.repository.enqueueJob({
      organizationId: input.organizationId,
      requestedById: user.id,
      courseId: input.courseId,
      lessonId: input.lessonId,
      assignmentId: input.assignmentId,
      type: input.type,
      payload: { ...input.payload, feature: input.feature },
      idempotencyKey: `${input.type}:${randomUUID()}`,
    });
  }
}
