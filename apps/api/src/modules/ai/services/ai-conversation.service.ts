import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import type { AIFeatureValue } from '../constants/ai.constants';
import { AI_REPOSITORY } from '../constants/injection-tokens';
import { AIConversationNotFoundException } from '../exceptions';
import type { AIRepository } from '../interfaces/ai-repository.interface';
import { AIMapper } from '../mappers/ai.mapper';
import { assertAIOrganizationAccess } from '../utils/ai-org-access';

@Injectable()
export class AIConversationService {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  list(user: AuthenticatedUser, query: {
    organizationId: string;
    feature?: AIFeatureValue;
    search?: string;
    page: number;
    limit: number;
  }) {
    assertAIOrganizationAccess(user, query.organizationId);
    return this.repository
      .listConversations({
        organizationId: query.organizationId,
        userId: user.id,
        feature: query.feature,
        search: query.search,
        page: query.page,
        limit: query.limit,
      })
      .then((result) => AIMapper.conversationPage(result, query.page, query.limit));
  }

  async get(user: AuthenticatedUser, organizationId: string, id: string) {
    assertAIOrganizationAccess(user, organizationId);
    const conversation = await this.repository.findConversation(organizationId, id, user.id);
    if (!conversation) throw new AIConversationNotFoundException();
    const messages = await this.repository.listMessages(organizationId, id);
    return {
      conversation: AIMapper.conversation(conversation),
      messages: messages.map((message) => AIMapper.message(message)),
    };
  }

  create(user: AuthenticatedUser, input: {
    organizationId: string;
    feature: AIFeatureValue;
    title?: string;
    courseId?: string;
    lessonId?: string;
    assignmentId?: string;
  }) {
    assertAIOrganizationAccess(user, input.organizationId);
    const provider = this.config.get('AI_PROVIDER', { infer: true });
    const model = this.config.get('OPENAI_MODEL', { infer: true });
    return this.repository
      .createConversation({
        organizationId: input.organizationId,
        userId: user.id,
        feature: input.feature,
        title: input.title,
        courseId: input.courseId,
        lessonId: input.lessonId,
        assignmentId: input.assignmentId,
        provider,
        model,
      })
      .then((record) => AIMapper.conversation(record));
  }

  async update(
    user: AuthenticatedUser,
    organizationId: string,
    id: string,
    input: { title?: string; pinned?: boolean },
  ) {
    assertAIOrganizationAccess(user, organizationId);
    const updated = await this.repository.updateConversation(organizationId, id, user.id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.pinned !== undefined
        ? { pinnedAt: input.pinned ? new Date() : null }
        : {}),
    });
    if (!updated) throw new AIConversationNotFoundException();
    return AIMapper.conversation(updated);
  }

  async remove(user: AuthenticatedUser, organizationId: string, id: string) {
    assertAIOrganizationAccess(user, organizationId);
    const deleted = await this.repository.softDeleteConversation(organizationId, id, user.id);
    if (!deleted) throw new AIConversationNotFoundException();
    return { deleted: true };
  }
}
