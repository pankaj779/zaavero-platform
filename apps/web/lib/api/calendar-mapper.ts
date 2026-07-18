import {
  teacherCalendarComingSoonFeatures,
  type TeacherCalendarEventDto,
  type TeacherCalendarEventStatus,
  type TeacherCalendarEventType,
} from '../teacher/calendar-types';

/** Raw calendar event payload from NestJS Calendar API (frontend-owned mirror). */
export interface CalendarApiRecord {
  id: string;
  organizationId: string;
  courseId: string | null;
  batchId: string | null;
  liveSessionId: string | null;
  assignmentId: string | null;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  externalProvider: string;
  externalEventId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CalendarListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CalendarListResult {
  items: TeacherCalendarEventDto[];
  meta: CalendarListMeta;
}

export interface CalendarCourseLookup {
  id: string;
  slug: string;
  title: string;
}

export interface CalendarBatchLookup {
  id: string;
  name: string;
}

/**
 * Derive UI event type from relationship IDs (API has no event-type field).
 * TEMPORARY until the backend exposes a dedicated type.
 */
export function deriveCalendarEventType(record: CalendarApiRecord): TeacherCalendarEventType {
  if (record.liveSessionId) {
    return 'live_class';
  }
  if (record.assignmentId) {
    return 'assignment_due';
  }
  if (
    record.allDay &&
    !record.courseId &&
    !record.batchId &&
    !record.liveSessionId &&
    !record.assignmentId
  ) {
    return 'holiday';
  }
  return 'reminder';
}

/**
 * Derive UI status from timestamps (API has no status field).
 * TEMPORARY until the backend exposes event status.
 */
export function deriveCalendarEventStatus(
  record: CalendarApiRecord,
  now = new Date(),
): TeacherCalendarEventStatus {
  const end = record.endsAt ?? record.startsAt;
  if (new Date(end).getTime() < now.getTime()) {
    return 'completed';
  }
  return 'scheduled';
}

function mapMeetingProvider(externalProvider: string): string | null {
  switch (externalProvider.toUpperCase()) {
    case 'GOOGLE':
      return 'Google';
    case 'OUTLOOK':
      return 'Outlook';
    case 'NONE':
    default:
      return null;
  }
}

/**
 * Maps NestJS calendar records to teacher workspace DTOs.
 *
 * TEMPORARY PLACEHOLDERS (until related endpoints exist):
 * - event type / status (derived; not on CalendarEventResponseDto)
 * - course title/slug (enriched via lookups when available)
 * - batch name (enriched via lookups when available)
 * - mentor identity
 * - timezone
 * - meetingUrl / location kept null for the current UI contract
 * - google/outlook sync, meeting provisioning, reminders stay coming_soon
 */
export function mapCalendarApiToTeacherEvent(
  record: CalendarApiRecord,
  lookups?: {
    courses?: ReadonlyMap<string, CalendarCourseLookup>;
    batches?: ReadonlyMap<string, CalendarBatchLookup>;
  },
  now = new Date(),
): TeacherCalendarEventDto {
  const course = record.courseId ? lookups?.courses?.get(record.courseId) : undefined;
  const batch = record.batchId ? lookups?.batches?.get(record.batchId) : undefined;

  return {
    id: record.id,
    title: record.title,
    type: deriveCalendarEventType(record),
    course: record.courseId
      ? {
          id: record.courseId,
          slug: course?.slug ?? '',
          title: course?.title ?? 'Course',
        }
      : null,
    batch: record.batchId
      ? {
          id: record.batchId,
          name: batch?.name ?? 'Batch',
        }
      : null,
    mentor: {
      id: '',
      // TEMPORARY: mentor identity is not on CalendarEventResponseDto.
      name: 'Teacher',
    },
    startTime: record.startsAt,
    endTime: record.endsAt ?? record.startsAt,
    // TEMPORARY: timezone is not on CalendarEventResponseDto.
    timezone: 'UTC',
    meetingProvider: mapMeetingProvider(record.externalProvider),
    meetingUrl: null,
    location: null,
    status: deriveCalendarEventStatus(record, now),
    description: record.description ?? '',
    futureFeatures: teacherCalendarComingSoonFeatures,
  };
}

export function mapCalendarApiList(
  records: CalendarApiRecord[],
  lookups?: {
    courses?: ReadonlyMap<string, CalendarCourseLookup>;
    batches?: ReadonlyMap<string, CalendarBatchLookup>;
  },
  now = new Date(),
): TeacherCalendarEventDto[] {
  return records.map((record) => mapCalendarApiToTeacherEvent(record, lookups, now));
}
