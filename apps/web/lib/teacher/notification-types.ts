import type { IconName } from '../constants/icons';
import { formatDashboardDateTime, formatDashboardRelativeTime } from '../dashboard/format-date';

export type TeacherNotificationsViewState = 'loading' | 'empty' | 'error' | 'populated';

export type TeacherNotificationType =
  'assignment' | 'live_class' | 'certificate' | 'system' | 'payment' | 'announcement';

export type TeacherNotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type TeacherNotificationStatusFilter = 'all' | 'unread' | 'read' | TeacherNotificationType;

export type TeacherNotificationSortOption = 'newest' | 'oldest';

export interface TeacherNotificationFutureFeaturesDto {
  realtimeEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  websocketsEnabled: boolean;
  preferencesEnabled: boolean;
  deepLinkingEnabled: boolean;
  readReceiptsEnabled: boolean;
}

/** Primary list DTO for the Teacher Notifications workspace. */
export interface TeacherNotificationDto {
  id: string;
  /** Recipient user id from NotificationResponseDto. */
  userId: string;
  title: string;
  message: string;
  type: TeacherNotificationType;
  priority: TeacherNotificationPriority;
  createdAt: string;
  readAt: string | null;
  /** Always null because the Notification API has no archive state. */
  archivedAt: null;
  actionLabel: string | null;
  /** Always null until trusted deep links are returned by the API. */
  actionUrl: null;
  icon: IconName;
  relatedFeatureLabel: string;
  futureFeatures: TeacherNotificationFutureFeaturesDto;
}

export interface TeacherNotificationStatDto {
  id: 'unread' | 'read' | 'today' | 'week';
  label: string;
  value: string;
  helper: string;
}

export const teacherNotificationFutureFeatures: TeacherNotificationFutureFeaturesDto = {
  realtimeEnabled: false,
  emailEnabled: false,
  pushEnabled: false,
  websocketsEnabled: false,
  preferencesEnabled: false,
  deepLinkingEnabled: false,
  readReceiptsEnabled: false,
};

export const teacherNotificationsPageCopy = {
  title: 'Notifications',
  description: 'Stay aware of teaching updates across your organization.',
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
  createdLabel: 'Created',
  relatedLabel: 'Related feature',
  actionPlaceholder: 'Future action placeholder — deep links are not enabled yet.',
  emptyTitle: 'No notifications yet',
  emptyDescription: 'Teaching and account updates will appear here.',
  errorTitle: 'Unable to load notifications',
  errorDescription: 'Something went wrong while loading notifications. Please try again.',
  priorityLabel: 'Priority',
  typeLabel: 'Type',
} as const;

export const teacherNotificationTypeLabel: Record<TeacherNotificationType, string> = {
  assignment: 'Assignment',
  live_class: 'Live Class',
  certificate: 'Certificate',
  system: 'System',
  payment: 'Payment',
  announcement: 'Announcement',
};

export const teacherNotificationPriorityLabel: Record<TeacherNotificationPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const teacherNotificationStatusFilterOptions: {
  value: TeacherNotificationStatusFilter;
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

export const teacherNotificationSortOptions: {
  value: TeacherNotificationSortOption;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getTeacherNotificationStats(
  items: TeacherNotificationDto[],
  now = new Date(),
): TeacherNotificationStatDto[] {
  const todayStart = startOfLocalDay(now).getTime();
  const weekStart = startOfLocalDay(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartMs = weekStart.getTime();

  const unread = items.filter((item) => item.readAt === null).length;
  const read = items.filter((item) => item.readAt !== null).length;
  const today = items.filter((item) => new Date(item.createdAt).getTime() >= todayStart).length;
  const thisWeek = items.filter((item) => new Date(item.createdAt).getTime() >= weekStartMs).length;

  return [
    { id: 'unread', label: 'Unread', value: String(unread), helper: 'Awaiting review' },
    { id: 'read', label: 'Read', value: String(read), helper: 'Already reviewed' },
    { id: 'today', label: 'Today', value: String(today), helper: 'Created today' },
    { id: 'week', label: 'This Week', value: String(thisWeek), helper: 'Last 7 days' },
  ];
}

export function filterTeacherNotifications(
  items: TeacherNotificationDto[],
  query: string,
  status: TeacherNotificationStatusFilter,
): TeacherNotificationDto[] {
  const normalized = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesStatus =
      status === 'all'
        ? true
        : status === 'unread'
          ? item.readAt === null
          : status === 'read'
            ? item.readAt !== null
            : item.type === status;

    if (!matchesStatus) {
      return false;
    }

    return (
      !normalized ||
      item.title.toLowerCase().includes(normalized) ||
      item.message.toLowerCase().includes(normalized) ||
      teacherNotificationTypeLabel[item.type].toLowerCase().includes(normalized) ||
      item.type.toLowerCase().includes(normalized)
    );
  });
}

export function sortTeacherNotifications(
  items: TeacherNotificationDto[],
  sort: TeacherNotificationSortOption,
): TeacherNotificationDto[] {
  return [...items].sort((a, b) => {
    const difference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sort === 'oldest' ? difference : -difference;
  });
}

export function getTeacherNotificationById(
  items: TeacherNotificationDto[],
  id: string,
): TeacherNotificationDto | null {
  return items.find((item) => item.id === id) ?? null;
}

export function isTeacherNotificationUnread(item: TeacherNotificationDto): boolean {
  return item.readAt === null;
}

export function formatTeacherNotificationDate(iso: string): string {
  return formatDashboardDateTime(iso);
}

export function formatTeacherNotificationRelativeTime(iso: string): string {
  return formatDashboardRelativeTime(iso);
}

export function toNotificationApiType(status: TeacherNotificationStatusFilter): string | undefined {
  if (status === 'all' || status === 'read' || status === 'unread') {
    return undefined;
  }
  return status;
}

export function toNotificationApiUnreadOnly(
  status: TeacherNotificationStatusFilter,
): boolean | undefined {
  return status === 'unread' ? true : undefined;
}

export function toNotificationListSort(sort: TeacherNotificationSortOption): {
  sortBy: 'createdAt';
  sortOrder: 'asc' | 'desc';
} {
  return {
    sortBy: 'createdAt',
    sortOrder: sort === 'oldest' ? 'asc' : 'desc',
  };
}
