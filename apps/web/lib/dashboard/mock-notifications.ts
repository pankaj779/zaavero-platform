/**
 * Notifications DTOs — shaped like future GET /student/notifications responses.
 * Honest placeholders: actionUrl always null; no realtime/push/email delivery.
 */

import type { IconName } from '../constants/icons';
import {
  formatDashboardDateTime,
  formatDashboardRelativeTime,
} from './format-date';

export type NotificationsViewState = 'loading' | 'empty' | 'error' | 'populated';

export type NotificationType =
  | 'assignment'
  | 'live_class'
  | 'certificate'
  | 'system'
  | 'payment'
  | 'announcement';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationStatusFilter =
  | 'all'
  | 'unread'
  | 'read'
  | NotificationType;

export type NotificationSortOption = 'newest' | 'oldest';

/** Future expansion — architecture only */
export interface NotificationFutureFeaturesDto {
  realtimeEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  websocketsEnabled: boolean;
  preferencesEnabled: boolean;
  deepLinkingEnabled: boolean;
  readReceiptsEnabled: boolean;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  createdAt: string;
  /** null = unread */
  readAt: string | null;
  /** null = not archived */
  archivedAt: string | null;
  actionLabel: string | null;
  /** Always null until deep linking is enabled */
  actionUrl: string | null;
  icon: IconName;
  relatedFeatureLabel: string;
  futureFeatures: NotificationFutureFeaturesDto;
}

export interface NotificationStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const notificationsViewState: NotificationsViewState = 'populated';

export const notificationsPageCopy = {
  title: 'Notifications',
  description:
    'Stay aware of learning updates. Opening, marking read, and archiving will arrive later.',
  searchPlaceholder: 'Search notifications',
  searchLabel: 'Search by title, message, or type',
  statusFilterLabel: 'Filter notifications',
  sortLabel: 'Sort notifications',
  statsLabel: 'Notification statistics',
  listLabel: 'Notifications list',
  detailsTitle: 'Notification Details',
  detailsEmpty: 'Select a notification to view details.',
  open: 'Open',
  markAsRead: 'Mark as Read',
  archive: 'Archive',
  comingSoon: 'Coming Soon',
  unreadLabel: 'Unread',
  readLabel: 'Read',
  archivedLabel: 'Archived',
  createdLabel: 'Created',
  relatedLabel: 'Related feature',
  actionPlaceholder: 'Future action placeholder — deep links are not enabled yet.',
  emptyTitle: 'No notifications yet',
  emptyDescription:
    'When assignments, classes, and account updates arrive, they will appear here.',
  errorTitle: 'Unable to load notifications',
  errorDescription: 'Something went wrong while loading notifications. Please try again.',
  priorityLabel: 'Priority',
  typeLabel: 'Type',
} as const;

export const notificationTypeLabel: Record<NotificationType, string> = {
  assignment: 'Assignment',
  live_class: 'Live Class',
  certificate: 'Certificate',
  system: 'System',
  payment: 'Payment',
  announcement: 'Announcement',
};

export const notificationPriorityLabel: Record<NotificationPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const notificationStatusFilterOptions: {
  value: NotificationStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'assignment', label: 'Assignments' },
  { value: 'live_class', label: 'Classes' },
  { value: 'certificate', label: 'Certificates' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'payment', label: 'Payments' },
  { value: 'system', label: 'System' },
];

export const notificationSortOptions: { value: NotificationSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const defaultFutureFeatures: NotificationFutureFeaturesDto = {
  realtimeEnabled: false,
  emailEnabled: false,
  pushEnabled: false,
  websocketsEnabled: false,
  preferencesEnabled: false,
  deepLinkingEnabled: false,
  readReceiptsEnabled: false,
};

function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(11, 0, 0, 0);
  return date.toISOString();
}

function createNotification(input: {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  createdAt: string;
  readAt: string | null;
  archivedAt?: string | null;
  actionLabel: string | null;
  icon: IconName;
  relatedFeatureLabel: string;
}): NotificationDto {
  return {
    id: input.id,
    title: input.title,
    message: input.message,
    type: input.type,
    priority: input.priority,
    createdAt: input.createdAt,
    readAt: input.readAt,
    archivedAt: input.archivedAt ?? null,
    actionLabel: input.actionLabel,
    actionUrl: null,
    icon: input.icon,
    relatedFeatureLabel: input.relatedFeatureLabel,
    futureFeatures: defaultFutureFeatures,
  };
}

export const notifications: NotificationDto[] = [
  createNotification({
    id: 'notif_001',
    title: 'Assignment deadline approaching',
    message:
      'Baseline Observation Worksheet is due soon. Submission uploads are not enabled yet — this alert is a placeholder.',
    type: 'assignment',
    priority: 'high',
    createdAt: hoursAgo(2),
    readAt: null,
    actionLabel: 'View assignment',
    icon: 'clipboard',
    relatedFeatureLabel: 'Assignments',
  }),
  createNotification({
    id: 'notif_002',
    title: 'Live class reminder',
    message:
      'Foundations Review is scheduled for later today. Join controls remain Coming Soon.',
    type: 'live_class',
    priority: 'medium',
    createdAt: hoursAgo(5),
    readAt: null,
    actionLabel: 'View live class',
    icon: 'video',
    relatedFeatureLabel: 'Live Classes',
  }),
  createNotification({
    id: 'notif_003',
    title: 'Certificate processing update',
    message:
      'Your Handwriting Improvement certificate status is processing. Downloads are not available yet.',
    type: 'certificate',
    priority: 'medium',
    createdAt: daysAgo(1),
    readAt: hoursAgo(20),
    actionLabel: 'View certificate',
    icon: 'award',
    relatedFeatureLabel: 'Certificates',
  }),
  createNotification({
    id: 'notif_004',
    title: 'Program announcement',
    message:
      'Announcement placeholder for enrolled programs. Content will be replaced when announcement delivery is connected.',
    type: 'announcement',
    priority: 'low',
    createdAt: daysAgo(2),
    readAt: daysAgo(1),
    actionLabel: 'View announcement',
    icon: 'bell',
    relatedFeatureLabel: 'Announcements',
  }),
  createNotification({
    id: 'notif_005',
    title: 'Payment receipt placeholder',
    message:
      'A payment-related notice placeholder. No invoice links are exposed in this sprint.',
    type: 'payment',
    priority: 'low',
    createdAt: daysAgo(4),
    readAt: daysAgo(3),
    actionLabel: 'View payments',
    icon: 'creditCard',
    relatedFeatureLabel: 'Payments',
  }),
  createNotification({
    id: 'notif_006',
    title: 'System maintenance notice',
    message:
      'System notice placeholder. Platform maintenance messaging will appear here when connected.',
    type: 'system',
    priority: 'critical',
    createdAt: daysAgo(6),
    readAt: null,
    actionLabel: null,
    icon: 'alert',
    relatedFeatureLabel: 'System',
  }),
  createNotification({
    id: 'notif_007',
    title: 'Archived reminder placeholder',
    message: 'This archived notification is kept for statistics and future archive filters.',
    type: 'system',
    priority: 'low',
    createdAt: daysAgo(10),
    readAt: daysAgo(9),
    archivedAt: daysAgo(8),
    actionLabel: null,
    icon: 'alert',
    relatedFeatureLabel: 'System',
  }),
];

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getNotificationStats(
  items: NotificationDto[] = notifications,
): NotificationStatDto[] {
  const now = new Date();
  const todayStart = startOfLocalDay(now).getTime();
  const weekStart = startOfLocalDay(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartMs = weekStart.getTime();

  const unread = items.filter((item) => item.readAt === null && item.archivedAt === null).length;
  const today = items.filter((item) => new Date(item.createdAt).getTime() >= todayStart).length;
  const thisWeek = items.filter((item) => new Date(item.createdAt).getTime() >= weekStartMs).length;
  const archived = items.filter((item) => item.archivedAt !== null).length;

  return [
    {
      id: 'unread',
      label: 'Unread',
      value: String(unread),
      helper: 'Awaiting review',
    },
    {
      id: 'today',
      label: 'Today',
      value: String(today),
      helper: 'Created today',
    },
    {
      id: 'week',
      label: 'This Week',
      value: String(thisWeek),
      helper: 'Last 7 days',
    },
    {
      id: 'archived',
      label: 'Archived',
      value: String(archived),
      helper: 'Archive actions later',
    },
  ];
}

export function filterNotifications(
  items: NotificationDto[],
  query: string,
  status: NotificationStatusFilter,
): NotificationDto[] {
  const normalized = query.trim().toLowerCase();

  return items.filter((item) => {
    let matchesStatus = true;
    switch (status) {
      case 'all':
        matchesStatus = item.archivedAt === null;
        break;
      case 'unread':
        matchesStatus = item.readAt === null && item.archivedAt === null;
        break;
      case 'read':
        matchesStatus = item.readAt !== null && item.archivedAt === null;
        break;
      default:
        matchesStatus = item.type === status && item.archivedAt === null;
        break;
    }

    if (!matchesStatus) {
      return false;
    }
    if (!normalized) {
      return true;
    }

    return (
      item.title.toLowerCase().includes(normalized) ||
      item.message.toLowerCase().includes(normalized) ||
      notificationTypeLabel[item.type].toLowerCase().includes(normalized) ||
      item.type.toLowerCase().includes(normalized)
    );
  });
}

export function sortNotifications(
  items: NotificationDto[],
  sort: NotificationSortOption,
): NotificationDto[] {
  const next = [...items];
  if (sort === 'oldest') {
    return next.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }
  return next.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function formatNotificationDate(iso: string): string {
  return formatDashboardDateTime(iso);
}

export function formatNotificationRelativeTime(iso: string): string {
  return formatDashboardRelativeTime(iso);
}

export function getNotificationById(
  id: string,
  items: NotificationDto[] = notifications,
): NotificationDto | null {
  return items.find((item) => item.id === id) ?? null;
}

export function isNotificationUnread(item: NotificationDto): boolean {
  return item.readAt === null && item.archivedAt === null;
}
