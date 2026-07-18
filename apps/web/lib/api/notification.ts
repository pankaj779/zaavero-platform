import { apiFetch } from '../auth/api-client';
import type { TeacherNotificationDto } from '../teacher/notification-types';
import {
  mapNotificationApiList,
  mapNotificationApiToTeacherDto,
  type NotificationApiRecord,
  type NotificationListMeta,
  type NotificationListResult,
} from './notification-mapper';

export interface ListNotificationsParams {
  organizationId?: string;
  userId?: string;
  channel?: 'IN_APP' | 'EMAIL' | 'PUSH';
  type?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateNotificationInput {
  read: boolean;
}

export interface MarkAllNotificationsReadResult {
  updatedCount: number;
}

interface PaginatedNotificationsApiPayload {
  items: NotificationApiRecord[];
  meta: NotificationListMeta;
}

function buildQuery(params: ListNotificationsParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.userId) {
    query.set('userId', params.userId);
  }
  if (params.channel) {
    query.set('channel', params.channel);
  }
  if (params.type?.trim()) {
    query.set('type', params.type.trim());
  }
  if (params.unreadOnly !== undefined) {
    query.set('unreadOnly', String(params.unreadOnly));
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }

  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

/** All NestJS notification requests flow through this apiFetch-based client. */
export const NotificationApi = {
  async getNotifications(params: ListNotificationsParams = {}): Promise<NotificationListResult> {
    const payload = await apiFetch<PaginatedNotificationsApiPayload>(
      `/notifications${buildQuery(params)}`,
    );

    return {
      items: mapNotificationApiList(payload.items),
      meta: payload.meta,
    };
  },

  async getNotification(id: string): Promise<TeacherNotificationDto> {
    const record = await apiFetch<NotificationApiRecord>(`/notifications/${id}`);
    return mapNotificationApiToTeacherDto(record);
  },

  async updateNotification(
    id: string,
    input: UpdateNotificationInput,
  ): Promise<TeacherNotificationDto> {
    const record = await apiFetch<NotificationApiRecord>(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapNotificationApiToTeacherDto(record);
  },

  async markNotificationRead(id: string): Promise<TeacherNotificationDto> {
    const record = await apiFetch<NotificationApiRecord>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return mapNotificationApiToTeacherDto(record);
  },

  async markAllNotificationsRead(organizationId?: string): Promise<MarkAllNotificationsReadResult> {
    const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    return apiFetch<MarkAllNotificationsReadResult>(`/notifications/read-all${query}`, {
      method: 'POST',
    });
  },
};
