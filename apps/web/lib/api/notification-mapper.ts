import type { IconName } from '../constants/icons';
import {
  teacherNotificationFutureFeatures,
  teacherNotificationTypeLabel,
  type TeacherNotificationDto,
  type TeacherNotificationType,
} from '../teacher/notification-types';

/** Raw notification payload from NestJS Notification API (frontend-owned mirror). */
export interface NotificationApiRecord {
  id: string;
  organizationId: string;
  userId: string;
  channel: 'IN_APP' | 'EMAIL' | 'PUSH';
  type: string;
  title: string;
  body: string | null;
  data: unknown;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationListResult {
  items: TeacherNotificationDto[];
  meta: NotificationListMeta;
}

function normalizeType(type: string): string {
  return type
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

/** Maps arbitrary backend type strings into the fixed current UI categories. */
export function mapNotificationType(type: string): TeacherNotificationType {
  switch (normalizeType(type)) {
    case 'assignment':
    case 'assignment_due':
    case 'submission':
    case 'submission_received':
      return 'assignment';
    case 'live_class':
    case 'live_session':
    case 'class_reminder':
      return 'live_class';
    case 'certificate':
    case 'certificate_issued':
      return 'certificate';
    case 'payment':
    case 'payment_received':
      return 'payment';
    case 'announcement':
      return 'announcement';
    default:
      return 'system';
  }
}

function iconForType(type: TeacherNotificationType): IconName {
  switch (type) {
    case 'assignment':
      return 'clipboard';
    case 'live_class':
      return 'video';
    case 'certificate':
      return 'award';
    case 'payment':
      return 'creditCard';
    case 'announcement':
      return 'bell';
    case 'system':
      return 'alert';
  }
}

/**
 * Maps a NestJS notification record into the Teacher Notifications DTO.
 *
 * TEMPORARY PLACEHOLDERS (not returned by NotificationResponseDto):
 * - priority is `medium`
 * - archive state, action label/URL and deep links are unavailable
 * - sender avatar and course thumbnail are not represented by the current UI DTO
 * - email/push/realtime delivery states remain disabled
 */
export function mapNotificationApiToTeacherDto(
  record: NotificationApiRecord,
): TeacherNotificationDto {
  const type = mapNotificationType(record.type);

  return {
    id: record.id,
    userId: record.userId,
    title: record.title,
    message: record.body ?? '',
    type,
    priority: 'medium',
    createdAt: record.createdAt,
    readAt: record.readAt,
    archivedAt: null,
    actionLabel: null,
    actionUrl: null,
    icon: iconForType(type),
    relatedFeatureLabel: teacherNotificationTypeLabel[type],
    futureFeatures: teacherNotificationFutureFeatures,
  };
}

export function mapNotificationApiList(records: NotificationApiRecord[]): TeacherNotificationDto[] {
  return records.map(mapNotificationApiToTeacherDto);
}
