import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  CreateNotificationData,
  NotificationListFilters,
  NotificationListResult,
  NotificationRecord,
  NotificationRepository,
} from '../interfaces/notification-repository.interface';

const notificationSelect = {
  id: true,
  organizationId: true,
  userId: true,
  channel: true,
  type: true,
  title: true,
  body: true,
  data: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  public readonly marker = 'notification-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<NotificationRecord | null> {
    return this.prisma.notification.findFirst({
      where: { id },
      select: notificationSelect,
    });
  }

  async findMany(filters: NotificationListFilters): Promise<NotificationListResult> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.channel ? { channel: filters.channel } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.unreadOnly ? { readAt: null } : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: notificationSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total };
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

  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    return this.prisma.notification.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        channel: data.channel ?? 'IN_APP',
        type: data.type,
        title: data.title,
        body: data.body ?? null,
        ...(data.data !== undefined ? { data: data.data as object } : {}),
      },
      select: notificationSelect,
    });
  }

  async updateReadState(id: string, read: boolean): Promise<NotificationRecord> {
    return this.prisma.notification.update({
      where: { id },
      data: {
        readAt: read ? new Date() : null,
      },
      select: notificationSelect,
    });
  }

  async markAllRead(organizationId: string, userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        organizationId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result.count;
  }
}
