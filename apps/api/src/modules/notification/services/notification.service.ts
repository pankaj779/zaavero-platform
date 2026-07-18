import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { NOTIFICATION_REPOSITORY } from '../constants/injection-tokens';
import type { CreateNotificationDto } from '../dto/create-notification.dto';
import type { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import type {
  MarkAllReadResponseDto,
  NotificationResponseDto,
  PaginatedNotificationsResponseDto,
} from '../dto/notification-response.dto';
import type { UpdateNotificationReadDto } from '../dto/update-notification-read.dto';
import {
  InvalidNotificationException,
  NotificationForbiddenException,
  NotificationNotFoundException,
  OrganizationAccessDeniedException,
} from '../exceptions';
import type {
  NotificationRecord,
  NotificationRepository,
} from '../interfaces/notification-repository.interface';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListNotificationsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedNotificationsResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const userId = this.resolveListUserId(user, query.userId);

    const result = await this.notificationRepository.findMany({
      organizationId,
      userId,
      channel: query.channel,
      type: query.type,
      unreadOnly: query.unreadOnly,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Notifications retrieved successfully.',
      data: {
        items: NotificationMapper.toResponseList(result.items),
        meta: buildPageMeta({
          total: result.total,
          page: query.page,
          limit: query.limit,
        }),
      },
    };
  }

  async getById(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<NotificationResponseDto>> {
    const notification = await this.requireAccessibleNotification(user, id);

    return {
      message: 'Notification retrieved successfully.',
      data: NotificationMapper.toResponse(notification),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateNotificationDto,
  ): Promise<ControllerSuccessPayload<NotificationResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);
    this.assertCanCreateForOthers(user);

    const userExists = await this.notificationRepository.userExistsInOrganization(
      dto.organizationId,
      dto.userId,
    );

    if (!userExists) {
      throw new InvalidNotificationException(
        'The specified user is not an active member of this organization.',
      );
    }

    const notification = await this.notificationRepository.create({
      organizationId: dto.organizationId,
      userId: dto.userId,
      channel: dto.channel,
      type: dto.type,
      title: dto.title,
      body: dto.body ?? null,
      data: dto.data,
    });

    return {
      message: 'Notification created successfully.',
      data: NotificationMapper.toResponse(notification),
    };
  }

  async updateReadState(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateNotificationReadDto,
  ): Promise<ControllerSuccessPayload<NotificationResponseDto>> {
    await this.requireAccessibleNotification(user, id);

    const updated = await this.notificationRepository.updateReadState(id, dto.read);

    return {
      message: dto.read ? 'Notification marked as read.' : 'Notification marked as unread.',
      data: NotificationMapper.toResponse(updated),
    };
  }

  async markRead(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<NotificationResponseDto>> {
    return this.updateReadState(user, id, { read: true });
  }

  async markAllRead(
    user: AuthenticatedUser,
    organizationId?: string,
  ): Promise<ControllerSuccessPayload<MarkAllReadResponseDto>> {
    const resolvedOrganizationId = this.resolveOrganizationId(user, organizationId);

    const updatedCount = await this.notificationRepository.markAllRead(
      resolvedOrganizationId,
      user.id,
    );

    return {
      message: 'All notifications marked as read.',
      data: { updatedCount },
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

  private isAdminOrTeacher(user: AuthenticatedUser): boolean {
    return user.roles.includes(AUTH_ROLES.admin) || user.roles.includes(AUTH_ROLES.teacher);
  }

  private isAdmin(user: AuthenticatedUser): boolean {
    return user.roles.includes(AUTH_ROLES.admin);
  }

  private assertCanCreateForOthers(user: AuthenticatedUser): void {
    if (!this.isAdminOrTeacher(user)) {
      throw new NotificationForbiddenException(
        'Only administrators and teachers can create notifications for users.',
      );
    }
  }

  private resolveListUserId(user: AuthenticatedUser, requestedUserId?: string): string | undefined {
    if (this.isAdminOrTeacher(user)) {
      return requestedUserId;
    }

    if (requestedUserId && requestedUserId !== user.id) {
      throw new NotificationForbiddenException('Students may only list their own notifications.');
    }

    return user.id;
  }

  private async requireAccessibleNotification(
    user: AuthenticatedUser,
    id: string,
  ): Promise<NotificationRecord> {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotificationNotFoundException();
    }

    this.assertOrganizationAccess(user, notification.organizationId);

    if (this.isAdmin(user) || notification.userId === user.id) {
      return notification;
    }

    if (this.isAdminOrTeacher(user)) {
      return notification;
    }

    throw new NotificationForbiddenException();
  }
}
