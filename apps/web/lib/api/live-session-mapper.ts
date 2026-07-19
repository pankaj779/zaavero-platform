import type {
  TeacherLiveClassDto,
  TeacherLiveClassStatus,
  TeacherMeetingProvider,
  TeacherMeetingStatus,
} from '../teacher/live-session-types';

/** Raw live-session payload from NestJS Live Session API (frontend-owned mirror). */
export interface LiveSessionApiRecord {
  id: string;
  organizationId: string;
  batchId: string;
  title: string;
  description: string | null;
  status: string;
  meetingProvider: string;
  meetingUrl: string | null;
  hostUrl?: string | null;
  recordingUrl: string | null;
  timezone?: string;
  syncStatus?: string;
  syncError?: string | null;
  startsAt: string;
  endsAt: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiveSessionListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LiveSessionListResult {
  items: TeacherLiveClassDto[];
  meta: LiveSessionListMeta;
}

export interface LiveSessionBatchLookup {
  id: string;
  name: string;
  courseId: string;
  studentsEnrolled: number;
}

export interface LiveSessionCourseLookup {
  id: string;
  slug: string;
  title: string;
}

function mapStatus(status: string): TeacherLiveClassStatus {
  switch (status.toUpperCase()) {
    case 'LIVE':
      return 'live';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'SCHEDULED':
    default:
      return 'scheduled';
  }
}

function mapProvider(provider: string): TeacherMeetingProvider {
  switch (provider.toUpperCase()) {
    case 'GOOGLE_MEET':
      return 'Google Meet';
    case 'CUSTOM':
      return 'Microsoft Teams';
    case 'SANDBOX':
      return 'Sandbox';
    case 'ZOOM':
    case 'NONE':
    default:
      return 'Zoom';
  }
}

function mapMeetingStatus(
  status: TeacherLiveClassStatus,
  providerRaw: string,
  meetingUrl: string | null,
): TeacherMeetingStatus {
  if (status === 'cancelled') {
    return 'cancelled';
  }
  if (status === 'live') {
    return 'in_progress';
  }
  if (status === 'completed') {
    return 'ended';
  }
  if (providerRaw.toUpperCase() === 'NONE' && !meetingUrl) {
    return 'setup_pending';
  }
  return meetingUrl ? 'ready' : 'setup_pending';
}

function durationMinutes(startsAt: string, endsAt: string | null): number {
  if (!endsAt) {
    return 0;
  }
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }
  return Math.round((end - start) / 60_000);
}

/**
 * Maps NestJS live-session records to teacher workspace DTOs.
 *
 * TEMPORARY PLACEHOLDERS (until related endpoints exist):
 * - course / batch titles (enriched via lookups when available)
 * - mentor name / avatar
 * - attendance rollups
 * - meetingUrl kept null in the UI contract (details panel uses pending copy)
 * - recording URL not surfaced on the current DTO
 */
export function mapLiveSessionApiToTeacherDto(
  record: LiveSessionApiRecord,
  lookups?: {
    batches?: ReadonlyMap<string, LiveSessionBatchLookup>;
    courses?: ReadonlyMap<string, LiveSessionCourseLookup>;
  },
): TeacherLiveClassDto {
  const status = mapStatus(record.status);
  const batch = lookups?.batches?.get(record.batchId);
  const course = batch ? lookups?.courses?.get(batch.courseId) : undefined;

  return {
    id: record.id,
    title: record.title,
    course: {
      id: course?.id ?? batch?.courseId ?? '',
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    batch: {
      id: record.batchId,
      name: batch?.name ?? 'Batch',
      studentsEnrolled: batch?.studentsEnrolled ?? 0,
    },
    // TEMPORARY: mentor identity is not on LiveSessionResponseDto.
    mentor: {
      id: '',
      name: 'Teacher',
    },
    startsAt: record.startsAt,
    endsAt: record.endsAt ?? record.startsAt,
    durationMinutes: durationMinutes(record.startsAt, record.endsAt),
    status,
    meeting: {
      provider: mapProvider(record.meetingProvider),
      status: mapMeetingStatus(status, record.meetingProvider, record.meetingUrl),
      meetingUrl: record.meetingUrl,
      hostUrl: record.hostUrl ?? null,
    },
    // TEMPORARY: attendance rollups are not on LiveSessionResponseDto.
    attendance: {
      totalStudents: batch?.studentsEnrolled ?? 0,
      present: 0,
      absent: 0,
      attendancePercent: null,
    },
    integrations: {
      calendar: record.meetingUrl ? 'available' : 'coming_soon',
      notifications: 'available',
      meetingProvisioning: record.meetingUrl ? 'available' : 'coming_soon',
      recording: record.recordingUrl ? 'available' : 'coming_soon',
    },
    updatedAt: record.updatedAt,
  };
}

export function mapLiveSessionApiList(
  records: LiveSessionApiRecord[],
  lookups?: {
    batches?: ReadonlyMap<string, LiveSessionBatchLookup>;
    courses?: ReadonlyMap<string, LiveSessionCourseLookup>;
  },
): TeacherLiveClassDto[] {
  return records.map((record) => mapLiveSessionApiToTeacherDto(record, lookups));
}
