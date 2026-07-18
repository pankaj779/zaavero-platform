import type {
  NotificationChannelValue,
  NotificationSortField,
} from '../constants/notification.constants';

export interface NotificationRecord {
  id: string;
  organizationId: string;
  userId: string;
  channel: NotificationChannelValue;
  type: string;
  title: string;
  body: string | null;
  data: unknown;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationListFilters {
  organizationId: string;
  userId?: string;
  channel?: NotificationChannelValue;
  type?: string;
  unreadOnly?: boolean;
  page: number;
  limit: number;
  sortBy: NotificationSortField;
  sortOrder: 'asc' | 'desc';
}

export interface NotificationListResult {
  items: NotificationRecord[];
  total: number;
}

export interface CreateNotificationData {
  organizationId: string;
  userId: string;
  channel?: NotificationChannelValue;
  type: string;
  title: string;
  body?: string | null;
  data?: unknown;
}

export interface UpdateNotificationReadData {
  read: boolean;
}

export interface NotificationRepository {
  readonly marker: 'notification-repository';

  findById(id: string): Promise<NotificationRecord | null>;

  findMany(filters: NotificationListFilters): Promise<NotificationListResult>;

  userExistsInOrganization(organizationId: string, userId: string): Promise<boolean>;

  create(data: CreateNotificationData): Promise<NotificationRecord>;

  updateReadState(id: string, read: boolean): Promise<NotificationRecord>;

  markAllRead(organizationId: string, userId: string): Promise<number>;
}
