import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Attendance DTOs — shaped like future GET /teachers/me/attendance responses.
 * Attendance is recorded per live class session; sessions belong to batches, batches
 * to courses. Meeting fields stay opaque (provider + URL) so future Zoom/Google Meet
 * and calendar integrations attach without remodeling. Graphology is one sample only.
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

/** Backend-shaped rollup — no client-side attendance math. */
export interface AttendanceCountsDto {
  totalStudents: number;
  present: number;
  absent: number;
  /** Null until the session is completed and attendance is recorded. */
  attendancePercent: number | null;
}

/** List-item DTO for the teacher attendance workspace. */
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

export const teacherAttendanceViewState: TeacherAttendanceViewState = 'populated';

export const teacherAttendancePageCopy = {
  title: 'Attendance',
  description: 'Attendance across your live class sessions, batch by batch.',
  searchPlaceholder: 'Search sessions, batches, or courses',
  searchLabel: 'Search attendance sessions',
  statusFilterLabel: 'Filter by session status',
  sortLabel: 'Sort sessions',
  viewModeLabel: 'Session view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  gridLabel: 'Attendance sessions',
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

/**
 * Sample sessions — Graphology appears once; other programs are generic.
 * Shape mirrors future GET /teachers/me/attendance response items.
 */
export const attendanceSessions: AttendanceSessionDto[] = [
  {
    id: 'tsession_001',
    title: 'Foundations Live Session 4',
    course: {
      id: 'tcourse_001',
      slug: 'graphology-foundation',
      title: 'Graphology Foundations',
    },
    batch: { id: 'tbatch_001', name: 'Graphology Foundations — Weekend Cohort' },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    status: 'completed',
    sessionDate: '2026-07-13T11:00:00.000Z',
    durationMinutes: 60,
    meetingProvider: null,
    meetingUrl: null,
    counts: { totalStudents: 3, present: 2, absent: 1, attendancePercent: 67 },
    records: [
      {
        studentId: 'tstudent_001',
        studentName: 'Student Placeholder One',
        initials: 'S1',
        status: 'present',
      },
      {
        studentId: 'tstudent_002',
        studentName: 'Student Placeholder Two',
        initials: 'S2',
        status: 'absent',
      },
      {
        studentId: 'tstudent_005',
        studentName: 'Student Placeholder Five',
        initials: 'S5',
        status: 'present',
      },
    ],
    updatedAt: '2026-07-13T12:15:00.000Z',
  },
  {
    id: 'tsession_002',
    title: 'Advanced Program Workshop 2',
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    batch: { id: 'tbatch_002', name: 'Advanced Program — Evening Cohort' },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    status: 'completed',
    sessionDate: '2026-07-10T15:30:00.000Z',
    durationMinutes: 90,
    meetingProvider: null,
    meetingUrl: null,
    counts: { totalStudents: 2, present: 2, absent: 0, attendancePercent: 100 },
    records: [
      {
        studentId: 'tstudent_002',
        studentName: 'Student Placeholder Two',
        initials: 'S2',
        status: 'present',
      },
      {
        studentId: 'tstudent_005',
        studentName: 'Student Placeholder Five',
        initials: 'S5',
        status: 'present',
      },
    ],
    updatedAt: '2026-07-10T17:05:00.000Z',
  },
  {
    id: 'tsession_003',
    title: 'Advanced Program Workshop 3',
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    batch: { id: 'tbatch_002', name: 'Advanced Program — Evening Cohort' },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    status: 'scheduled',
    sessionDate: '2026-07-24T15:30:00.000Z',
    durationMinutes: 90,
    meetingProvider: null,
    meetingUrl: null,
    counts: { totalStudents: 2, present: 0, absent: 0, attendancePercent: null },
    records: [],
    updatedAt: '2026-07-15T09:00:00.000Z',
  },
  {
    id: 'tsession_004',
    title: 'Skills Workshop Wrap-up',
    course: {
      id: 'tcourse_003',
      slug: 'sample-skills-workshop',
      title: 'Sample Skills Workshop',
    },
    batch: { id: 'tbatch_003', name: 'Skills Workshop — Morning Group' },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    status: 'cancelled',
    sessionDate: '2026-05-14T09:00:00.000Z',
    durationMinutes: 45,
    meetingProvider: null,
    meetingUrl: null,
    counts: { totalStudents: 1, present: 0, absent: 0, attendancePercent: null },
    records: [],
    updatedAt: '2026-05-12T08:30:00.000Z',
  },
];

/** Top stats derived from the mock list — mirrors a future aggregate endpoint. */
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
): AttendanceSessionDto[] {
  const normalized = query.trim().toLowerCase();

  return sessions.filter((session) => {
    const matchesStatus = status === 'all' || session.status === status;
    if (!matchesStatus) {
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
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
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
