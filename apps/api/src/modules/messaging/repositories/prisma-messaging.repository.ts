import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  ConversationListFilters,
  ConversationParticipantRecord,
  ConversationWithParticipantsRecord,
  CreateConversationData,
  CreateMessageData,
  MessageListFilters,
  MessageRecord,
  MessagingRepository,
  PaginatedListResult,
  UpdateConversationData,
} from '../interfaces/messaging-repository.interface';

const participantSelect = {
  id: true,
  organizationId: true,
  conversationId: true,
  userId: true,
  joinedAt: true,
  lastReadAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const conversationSelect = {
  id: true,
  organizationId: true,
  type: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  participants: {
    select: participantSelect,
  },
} as const;

const messageSelect = {
  id: true,
  organizationId: true,
  conversationId: true,
  senderId: true,
  body: true,
  attachments: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class PrismaMessagingRepository implements MessagingRepository {
  public readonly marker = 'messaging-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findConversationById(id: string): Promise<ConversationWithParticipantsRecord | null> {
    return this.prisma.conversation.findFirst({
      where: { id },
      select: conversationSelect,
    });
  }

  async findConversations(
    filters: ConversationListFilters,
  ): Promise<PaginatedListResult<ConversationWithParticipantsRecord>> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.participantUserId
        ? {
            participants: {
              some: { userId: filters.participantUserId },
            },
          }
        : {}),
      ...(filters.search
        ? {
            title: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        select: conversationSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { items, total };
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
      select: { id: true },
    });

    return participant !== null;
  }

  async userExistsInOrganization(organizationId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: 'ACTIVE',
        user: {
          deletedAt: null,
          isActive: true,
        },
      },
      select: { id: true },
    });

    return member !== null;
  }

  async createConversation(
    data: CreateConversationData,
  ): Promise<ConversationWithParticipantsRecord> {
    const uniqueParticipantIds = [...new Set([data.creatorUserId, ...data.participantUserIds])];

    return this.prisma.conversation.create({
      data: {
        organizationId: data.organizationId,
        type: data.type,
        title: data.title ?? null,
        participants: {
          create: uniqueParticipantIds.map((userId) => ({
            organizationId: data.organizationId,
            userId,
          })),
        },
      },
      select: conversationSelect,
    });
  }

  async updateConversation(
    id: string,
    data: UpdateConversationData,
  ): Promise<ConversationWithParticipantsRecord> {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
      },
      select: conversationSelect,
    });
  }

  async addParticipant(
    organizationId: string,
    conversationId: string,
    userId: string,
  ): Promise<ConversationParticipantRecord> {
    return this.prisma.conversationParticipant.create({
      data: {
        organizationId,
        conversationId,
        userId,
      },
      select: participantSelect,
    });
  }

  async findMessages(filters: MessageListFilters): Promise<PaginatedListResult<MessageRecord>> {
    const where = {
      organizationId: filters.organizationId,
      conversationId: filters.conversationId,
      deletedAt: null,
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        select: messageSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.message.count({ where }),
    ]);

    return { items, total };
  }

  async findMessageById(id: string): Promise<MessageRecord | null> {
    return this.prisma.message.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: messageSelect,
    });
  }

  async createMessage(data: CreateMessageData): Promise<MessageRecord> {
    return this.prisma.message.create({
      data: {
        organizationId: data.organizationId,
        conversationId: data.conversationId,
        senderId: data.senderId,
        body: data.body,
        attachments: data.attachments ?? [],
      },
      select: messageSelect,
    });
  }

  async softDeleteMessage(id: string): Promise<MessageRecord> {
    return this.prisma.message.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: messageSelect,
    });
  }
}
