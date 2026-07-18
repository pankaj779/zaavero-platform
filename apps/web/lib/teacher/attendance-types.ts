import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Attendance view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type AttendanceSessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStudentStatus = 'present' | 'absent';
export type TeacherAttendanceViewState = 'loading' | 'empty' | 'error' | 'populated';
export type AttendanceStatusFilter = 'all' | AttendanceSessionStatus;
export type AttendanceSortOption = 'session_date' | 'recently_updated' | 'alphabetical';
export type TeacherAttendanceViewMode = 'grid' | 'list';

export interface AttendanceCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface AttendanceBatchRefDto {
  id: string;
  name: string;
}

export interface AttendanceMentorDto {
  id: string;
  name: string;
}

/** Per-student attendance record within one session. */
export interface AttendanceRecordDto {
  studentId: string;
  studentName: string;
  initials: string;
  status: AttendanceStudentStatus;
}

/** Rollup counts for one session card. */
export interface AttendanceCountsDto {
  totalStudents: number;
  present: number;
  absent: number;
  /** Null until the session is completed and attendance is recorded. */
  attendancePercent: number | null;
}

/** List-item DTO for the teacher attendance workspace (session-centric). */
export interface AttendanceSessionDto {
  id: string;
  title: string;
  course: AttendanceCourseRefDto;
  batch: AttendanceBatchRefDto;
  mentor: AttendanceMentorDto;
  status: AttendanceSessionStatus;
  sessionDate: string;
  durationMinutes: number;
  /** Opaque integration fields for future calendar / Zoom / Google Meet. */
  meetingProvider: string | null;
  meetingUrl: string | null;
  counts: AttendanceCountsDto;
  records: AttendanceRecordDto[];
  updatedAt: string;
}

export interface TeacherAttendanceStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherAttendancePageCopy = {
  title: 'Attendance',
  description: 'Attendance across your live class sessions, batch by batch.',
  searchPlaceholder: 'Search sessions, batches, or courses',
  searchLabel: 'Search attendance sessions',
  statusFilterLabel: 'Filter by session status',
  courseFilterLabel: 'Filter by course',
  batchFilterLabel: 'Filter by batch',
  liveSessionFilterLabel: 'Filter by live session',
  sortLabel: 'Sort sessions',
  viewModeLabel: 'Session view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  gridLabel: 'Attendance sessions',
  allCoursesLabel: 'All Courses',
  allBatchesLabel: 'All Batches',
  allLiveSessionsLabel: 'All Live Sessions',
  emptyTitle: 'No sessions yet',
  emptyDescription:
    'Live class sessions with attendance will appear here. Attendance marking opens in a later sprint.',
  noMatchesTitle: 'No matching sessions',
  noMatchesDescription: 'Try a different session title, batch, course, or status filter.',
  errorTitle: 'Unable to load attendance',
  errorDescription: 'Something went wrong while loading Attendance. Please try again.',
  markButton: 'Mark Attendance',
  editButton: 'Edit',
  exportButton: 'Export',
  analyticsButton: 'Analytics',
  comingSoonNote: 'Attendance actions activate in a later sprint.',
  courseLabel: 'Course',
  batchLabel: 'Batch',
  mentorLabel: 'Mentor',
  sessionDateLabel: 'Session Date',
  durationLabel: 'Duration',
  totalStudentsLabel: 'Total Students',
  presentLabel: 'Present',
  absentLabel: 'Absent',
  attendanceLabel: 'Attendance',
  notRecordedLabel: 'Not recorded yet',
  lastUpdatedLabel: 'Last updated',
  detailsButton: 'View details',
  detailsPanelLabel: 'Session details',
  detailsRosterLabel: 'Student attendance',
  detailsSummaryLabel: 'Overall summary',
  detailsCloseLabel: 'Close details',
  detailsEmptyRoster: 'Attendance records appear once the session is completed.',
} as const;

export const attendanceSessionStatusLabel: Record<AttendanceSessionStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const attendanceStudentStatusLabel: Record<AttendanceStudentStatus, string> = {
  present: 'Present',
  absent: 'Absent',
};

export const attendanceStatusFilterOptions: {
  value: AttendanceStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const attendanceSortOptions: { value: AttendanceSortOption; label: string }[] = [
  { value: 'session_date', label: 'Session Date' },
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

/** Top stats derived from the session list — mirrors a future aggregate endpoint. */
export function getTeacherAttendanceStats(
  sessions: AttendanceSessionDto[],
): TeacherAttendanceStatDto[] {
  const completed = sessions.filter((session) => session.status === 'completed');
  const present = completed.reduce((sum, session) => sum + session.counts.present, 0);
  const absent = completed.reduce((sum, session) => sum + session.counts.absent, 0);
  const percents = completed
    .map((session) => session.counts.attendancePercent)
    .filter((value): value is number => value !== null);
  const average =
    percents.length === 0
      ? null
      : Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length);

  return [
    {
      id: 'sessions-conducted',
      label: 'Sessions Conducted',
      value: String(completed.length),
      helper: 'Completed live class sessions.',
    },
    {
      id: 'average-attendance',
      label: 'Average Attendance',
      value: average === null ? '—' : `${String(average)}%`,
      helper: 'Mean attendance across completed sessions.',
    },
    {
      id: 'students-present',
      label: 'Students Present',
      value: String(present),
      helper: 'Present marks across completed sessions.',
    },
    {
      id: 'students-absent',
      label: 'Students Absent',
      value: String(absent),
      helper: 'Absent marks across completed sessions.',
    },
  ];
}

export function filterAttendanceSessions(
  sessions: AttendanceSessionDto[],
  query: string,
  status: AttendanceStatusFilter,
  options?: {
    courseId?: string;
    batchId?: string;
    liveSessionId?: string;
  },
): AttendanceSessionDto[] {
  const normalized = query.trim().toLowerCase();
  const courseId = options?.courseId ?? 'all';
  const batchId = options?.batchId ?? 'all';
  const liveSessionId = options?.liveSessionId ?? 'all';

  return sessions.filter((session) => {
    const matchesStatus = status === 'all' || session.status === status;
    if (!matchesStatus) {
      return false;
    }
    if (courseId !== 'all' && session.course.id !== courseId) {
      return false;
    }
    if (batchId !== 'all' && session.batch.id !== batchId) {
      return false;
    }
    if (liveSessionId !== 'all' && session.id !== liveSessionId) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      session.title.toLowerCase().includes(normalized) ||
      session.batch.name.toLowerCase().includes(normalized) ||
      session.course.title.toLowerCase().includes(normalized) ||
      session.course.slug.toLowerCase().includes(normalized)
    );
  });
}

export function sortAttendanceSessions(
  sessions: AttendanceSessionDto[],
  sort: AttendanceSortOption,
): AttendanceSessionDto[] {
  const next = [...sessions];

  switch (sort) {
    case 'alphabetical':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'recently_updated':
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case 'session_date':
    default:
      return next.sort(
        (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime(),
      );
  }
}

export function getAttendanceSessionById(
  sessions: AttendanceSessionDto[],
  id: string,
): AttendanceSessionDto | null {
  return sessions.find((session) => session.id === id) ?? null;
}

export function formatAttendanceDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

export function formatAttendanceDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso);
}

/** Maps UI sort to NestJS Attendance list sort (row-level; session sort stays client-side). */
export function toAttendanceListSort(sort: AttendanceSortOption): {
  sortBy: 'createdAt' | 'updatedAt' | 'markedAt' | 'status';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'alphabetical':
      return { sortBy: 'status', sortOrder: 'asc' };
    case 'recently_updated':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'session_date':
    default:
      return { sortBy: 'markedAt', sortOrder: 'desc' };
  }
}

/**
 * Maps UI attendance-mark filters to NestJS AttendanceStatus.
 * Session status filters are applied client-side after live-session enrichment.
 */
export function toAttendanceApiMarkStatus(
  status: AttendanceStudentStatus | 'all',
): 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | undefined {
  switch (status) {
    case 'present':
      return 'PRESENT';
    case 'absent':
      return 'ABSENT';
    case 'all':
    default:
      return undefined;
  }
}
