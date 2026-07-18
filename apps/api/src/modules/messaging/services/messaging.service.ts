import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { MESSAGING_REPOSITORY } from '../constants/injection-tokens';
import type { AddParticipantDto } from '../dto/add-participant.dto';
import type { CreateConversationDto } from '../dto/create-conversation.dto';
import type { CreateMessageDto } from '../dto/create-message.dto';
import type { ListConversationsQueryDto } from '../dto/list-conversations-query.dto';
import type { ListMessagesQueryDto } from '../dto/list-messages-query.dto';
import type {
  ConversationResponseDto,
  MessageResponseDto,
  PaginatedConversationsResponseDto,
  PaginatedMessagesResponseDto,
} from '../dto/messaging-response.dto';
import type { UpdateConversationDto } from '../dto/update-conversation.dto';
import {
  ConversationConflictException,
  ConversationNotFoundException,
  InvalidConversationException,
  MessageNotFoundException,
  OrganizationAccessDeniedException,
  ParticipantForbiddenException,
} from '../exceptions';
import type {
  ConversationWithParticipantsRecord,
  MessageRecord,
  MessagingRepository,
} from '../interfaces/messaging-repository.interface';
import { MessagingMapper } from '../mappers/messaging.mapper';

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class MessagingService {
  constructor(
    @Inject(MESSAGING_REPOSITORY)
    private readonly messagingRepository: MessagingRepository,
  ) {}

  async listConversations(
    user: AuthenticatedUser,
    query: ListConversationsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedConversationsResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const isAdmin = user.roles.includes(AUTH_ROLES.admin);

    const result = await this.messagingRepository.findConversations({
      organizationId,
      participantUserId: isAdmin ? undefined : user.id,
      type: query.type,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return this.paginatedConversationsResponse(result, query.page, query.limit);
  }

  async getConversationById(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<ConversationResponseDto>> {
    const conversation = await this.requireAccessibleConversation(user, id);

    return {
      message: 'Conversation retrieved successfully.',
      data: MessagingMapper.toConversationResponse(conversation),
    };
  }

  async createConversation(
    user: AuthenticatedUser,
    dto: CreateConversationDto,
  ): Promise<ControllerSuccessPayload<ConversationResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);

    const participantIds = [...new Set(dto.participantUserIds.filter((id) => id !== user.id))];

    if (participantIds.length === 0) {
      throw new InvalidConversationException(
        'At least one participant other than the creator is required.',
      );
    }

    await this.assertUsersInOrganization(dto.organizationId, participantIds);

    const conversation = await this.messagingRepository.createConversation({
      organizationId: dto.organizationId,
      type: dto.type,
      title: dto.title ?? null,
      creatorUserId: user.id,
      participantUserIds: participantIds,
    });

    return {
      message: 'Conversation created successfully.',
      data: MessagingMapper.toConversationResponse(conversation),
    };
  }

  async updateConversation(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateConversationDto,
  ): Promise<ControllerSuccessPayload<ConversationResponseDto>> {
    await this.requireAccessibleConversation(user, id, { requireManageAccess: true });

    const updated = await this.messagingRepository.updateConversation(id, {
      title: dto.title,
    });

    return {
      message: 'Conversation updated successfully.',
      data: MessagingMapper.toConversationResponse(updated),
    };
  }

  async addParticipant(
    user: AuthenticatedUser,
    conversationId: string,
    dto: AddParticipantDto,
  ): Promise<ControllerSuccessPayload<ConversationResponseDto>> {
    const conversation = await this.requireAccessibleConversation(user, conversationId, {
      requireManageAccess: true,
    });

    const userExists = await this.messagingRepository.userExistsInOrganization(
      conversation.organizationId,
      dto.userId,
    );

    if (!userExists) {
      throw new InvalidConversationException('The specified user is not in this organization.');
    }

    const alreadyParticipant = await this.messagingRepository.isParticipant(
      conversationId,
      dto.userId,
    );

    if (alreadyParticipant) {
      throw new ConversationConflictException();
    }

    try {
      await this.messagingRepository.addParticipant(
        conversation.organizationId,
        conversationId,
        dto.userId,
      );
    } catch (error: unknown) {
      this.rethrowConflict(error);
      throw error;
    }

    const updated = await this.messagingRepository.findConversationById(conversationId);

    if (!updated) {
      throw new ConversationNotFoundException();
    }

    return {
      message: 'Participant added successfully.',
      data: MessagingMapper.toConversationResponse(updated),
    };
  }

  async listMessages(
    user: AuthenticatedUser,
    conversationId: string,
    query: ListMessagesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedMessagesResponseDto>> {
    const conversation = await this.requireAccessibleConversation(user, conversationId);

    const result = await this.messagingRepository.findMessages({
      organizationId: conversation.organizationId,
      conversationId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Messages retrieved successfully.',
      data: {
        items: MessagingMapper.toMessageResponseList(result.items),
        meta: buildPageMeta({
          total: result.total,
          page: query.page,
          limit: query.limit,
        }),
      },
    };
  }

  async sendMessage(
    user: AuthenticatedUser,
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<ControllerSuccessPayload<MessageResponseDto>> {
    const conversation = await this.requireAccessibleConversation(user, conversationId);

    const message = await this.messagingRepository.createMessage({
      organizationId: conversation.organizationId,
      conversationId,
      senderId: user.id,
      body: dto.body,
      attachments: dto.attachments,
    });

    return {
      message: 'Message sent successfully.',
      data: MessagingMapper.toMessageResponse(message),
    };
  }

  async deleteMessage(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<MessageResponseDto>> {
    const message = await this.requireDeletableMessage(user, id);
    const deleted = await this.messagingRepository.softDeleteMessage(message.id);

    return {
      message: 'Message deleted successfully.',
      data: MessagingMapper.toMessageResponse(deleted),
    };
  }

  private paginatedConversationsResponse(
    result: { items: ConversationWithParticipantsRecord[]; total: number },
    page: number,
    limit: number,
  ): ControllerSuccessPayload<PaginatedConversationsResponseDto> {
    return {
      message: 'Conversations retrieved successfully.',
      data: {
        items: MessagingMapper.toConversationResponseList(result.items),
        meta: buildPageMeta({
          total: result.total,
          page,
          limit,
        }),
      },
    };
  }

  private resolveOrganizationId(user: AuthenticatedUser, organizationId?: string): string {
    if (organizationId) {
      this.assertOrganizationAccess(user, organizationId);
      return organizationId;
    }

    if (user.organizationIds.length === 1) {
      const [onlyOrganizationId] = user.organizationIds;
      if (onlyOrganizationId) {
        return onlyOrganizationId;
      }
    }

    throw new OrganizationAccessDeniedException(
      'organizationId is required when you belong to multiple organizations.',
    );
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
    if (!user.organizationIds.includes(organizationId)) {
      throw new OrganizationAccessDeniedException();
    }
  }

  private isAdmin(user: AuthenticatedUser): boolean {
    return user.roles.includes(AUTH_ROLES.admin);
  }

  private canManageConversation(user: AuthenticatedUser): boolean {
    return this.isAdmin(user) || user.roles.includes(AUTH_ROLES.teacher);
  }

  private async requireAccessibleConversation(
    user: AuthenticatedUser,
    id: string,
    options: { requireManageAccess?: boolean } = {},
  ): Promise<ConversationWithParticipantsRecord> {
    const conversation = await this.messagingRepository.findConversationById(id);

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    this.assertOrganizationAccess(user, conversation.organizationId);

    if (options.requireManageAccess) {
      if (!this.canManageConversation(user)) {
        throw new ParticipantForbiddenException(
          'Only administrators and teachers can manage conversations.',
        );
      }
      return conversation;
    }

    if (this.isAdmin(user)) {
      return conversation;
    }

    const isParticipant = await this.messagingRepository.isParticipant(id, user.id);

    if (!isParticipant) {
      throw new ParticipantForbiddenException();
    }

    return conversation;
  }

  private async requireDeletableMessage(
    user: AuthenticatedUser,
    id: string,
  ): Promise<MessageRecord> {
    const message = await this.messagingRepository.findMessageById(id);

    if (!message) {
      throw new MessageNotFoundException();
    }

    this.assertOrganizationAccess(user, message.organizationId);

    if (this.isAdmin(user) || message.senderId === user.id) {
      return message;
    }

    throw new ParticipantForbiddenException('You may only delete messages you sent.');
  }

  private async assertUsersInOrganization(
    organizationId: string,
    userIds: string[],
  ): Promise<void> {
    for (const userId of userIds) {
      const exists = await this.messagingRepository.userExistsInOrganization(
        organizationId,
        userId,
      );

      if (!exists) {
        throw new InvalidConversationException(
          'One or more participants are not active members of this organization.',
        );
      }
    }
  }

  private rethrowConflict(error: unknown): void {
    if (isPrismaUniqueConflict(error)) {
      throw new ConversationConflictException();
    }
  }
}
