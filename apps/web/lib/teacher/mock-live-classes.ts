import { formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Live Class DTOs — shaped like future GET /live-sessions responses.
 * A session belongs to a batch and course. Provider, calendar, notification,
 * attendance, and recording fields remain transport data so integrations can
 * replace mocks without changing the UI contract.
 */

export type TeacherLiveClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type TeacherMeetingProvider = 'Zoom' | 'Google Meet' | 'Microsoft Teams';
export type TeacherMeetingStatus =
  | 'setup_pending'
  | 'ready'
  | 'in_progress'
  | 'ended'
  | 'cancelled';
export type TeacherLiveClassesViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherLiveClassStatusFilter = 'all' | TeacherLiveClassStatus;
export type TeacherLiveClassSortOption = 'upcoming' | 'recently_updated' | 'alphabetical';
export type TeacherLiveClassesViewMode = 'grid' | 'list';
export type TeacherIntegrationAvailability = 'coming_soon';

export interface TeacherLiveClassCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface TeacherLiveClassBatchRefDto {
  id: string;
  name: string;
  studentsEnrolled: number;
}

export interface TeacherLiveClassMentorDto {
  id: string;
  name: string;
}

export interface TeacherLiveClassMeetingDto {
  provider: TeacherMeetingProvider;
  status: TeacherMeetingStatus;
  /** Always null until meeting-provider provisioning is integrated. */
  meetingUrl: null;
}

export interface TeacherLiveClassAttendanceSummaryDto {
  totalStudents: number;
  present: number;
  absent: number;
  attendancePercent: number | null;
}

export interface TeacherLiveClassIntegrationsDto {
  calendar: TeacherIntegrationAvailability;
  notifications: TeacherIntegrationAvailability;
  meetingProvisioning: TeacherIntegrationAvailability;
  recording: TeacherIntegrationAvailability;
}

/** List/detail DTO for one occurrence of a batch-scoped live class. */
export interface TeacherLiveClassDto {
  id: string;
  title: string;
  course: TeacherLiveClassCourseRefDto;
  batch: TeacherLiveClassBatchRefDto;
  mentor: TeacherLiveClassMentorDto;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  status: TeacherLiveClassStatus;
  meeting: TeacherLiveClassMeetingDto;
  attendance: TeacherLiveClassAttendanceSummaryDto;
  integrations: TeacherLiveClassIntegrationsDto;
  updatedAt: string;
}

export interface TeacherLiveClassStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherLiveClassesViewState: TeacherLiveClassesViewState = 'populated';

export const teacherLiveClassesPageCopy = {
  title: 'Live Classes',
  description: 'Schedule and manage live teaching sessions across your batches.',
  searchPlaceholder: 'Search sessions, courses, or batches',
  searchLabel: 'Search live classes',
  statusFilterLabel: 'Filter by live class status',
  sortLabel: 'Sort live classes',
  viewModeLabel: 'Live class view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  collectionLabel: 'Live classes',
  emptyTitle: 'No live classes yet',
  emptyDescription:
    'Scheduled teaching sessions will appear here. Scheduling tools arrive in a later sprint.',
  noMatchesTitle: 'No matching live classes',
  noMatchesDescription: 'Try a different session title, course, batch, or status filter.',
  errorTitle: 'Unable to load live classes',
  errorDescription: 'Something went wrong while loading Live Classes. Please try again.',
  courseLabel: 'Course',
  batchLabel: 'Batch',
  mentorLabel: 'Mentor',
  startsAtLabel: 'Start Date & Time',
  endsAtLabel: 'End Date & Time',
  durationLabel: 'Duration',
  statusLabel: 'Status',
  meetingProviderLabel: 'Meeting Provider',
  meetingStatusLabel: 'Meeting Status',
  studentsEnrolledLabel: 'Students Enrolled',
  detailsButton: 'View details',
  startButton: 'Start Class',
  editScheduleButton: 'Edit Schedule',
  cancelSessionButton: 'Cancel Session',
  attendanceButton: 'Attendance',
  recordingButton: 'Recording',
  comingSoonNote: 'Live class actions are Coming Soon.',
  detailsPanelLabel: 'Live class details',
  detailsCloseLabel: 'Close live class details',
  sessionInfoLabel: 'Session information',
  batchInfoLabel: 'Batch information',
  scheduleLabel: 'Schedule',
  meetingInfoLabel: 'Meeting information',
  attendanceSummaryLabel: 'Attendance summary',
  futureIntegrationsLabel: 'Future integrations',
  meetingUrlLabel: 'Meeting URL',
  meetingUrlPending: 'Not available yet',
  totalStudentsLabel: 'Total Students',
  presentLabel: 'Present',
  absentLabel: 'Absent',
  attendanceRateLabel: 'Attendance Rate',
  notRecordedLabel: 'Not recorded yet',
  lastUpdatedLabel: 'Last updated',
} as const;

export const teacherLiveClassStatusLabel: Record<TeacherLiveClassStatus, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const teacherMeetingStatusLabel: Record<TeacherMeetingStatus, string> = {
  setup_pending: 'Setup Pending',
  ready: 'Ready',
  in_progress: 'In Progress',
  ended: 'Ended',
  cancelled: 'Cancelled',
};

export const teacherLiveClassStatusFilterOptions: {
  value: TeacherLiveClassStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const teacherLiveClassSortOptions: {
  value: TeacherLiveClassSortOption;
  label: string;
}[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const comingSoonIntegrations: TeacherLiveClassIntegrationsDto = {
  calendar: 'coming_soon',
  notifications: 'coming_soon',
  meetingProvisioning: 'coming_soon',
  recording: 'coming_soon',
};

/**
 * Course-agnostic sample sessions. Graphology is one data sample; the other
 * sessions demonstrate that the model supports unrelated programs.
 */
export const teacherLiveClasses: TeacherLiveClassDto[] = [
  {
    id: 'live_session_001',
    title: 'Foundations Live Session 5',
    course: {
      id: 'tcourse_001',
      slug: 'graphology-foundation',
      title: 'Graphology Foundations',
    },
    batch: {
      id: 'tbatch_001',
      name: 'Graphology Foundations — Weekend Cohort',
      studentsEnrolled: 18,
    },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    startsAt: '2026-07-18T11:00:00.000Z',
    endsAt: '2026-07-18T12:00:00.000Z',
    durationMinutes: 60,
    status: 'scheduled',
    meeting: { provider: 'Zoom', status: 'ready', meetingUrl: null },
    attendance: {
      totalStudents: 18,
      present: 0,
      absent: 0,
      attendancePercent: null,
    },
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-17T08:30:00.000Z',
  },
  {
    id: 'live_session_002',
    title: 'Advanced Program Studio',
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    batch: {
      id: 'tbatch_002',
      name: 'Advanced Program — Evening Cohort',
      studentsEnrolled: 14,
    },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    startsAt: '2026-07-17T11:30:00.000Z',
    endsAt: '2026-07-17T13:00:00.000Z',
    durationMinutes: 90,
    status: 'live',
    meeting: { provider: 'Google Meet', status: 'in_progress', meetingUrl: null },
    attendance: {
      totalStudents: 14,
      present: 11,
      absent: 3,
      attendancePercent: 79,
    },
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-17T11:32:00.000Z',
  },
  {
    id: 'live_session_003',
    title: 'Skills Workshop Review',
    course: {
      id: 'tcourse_003',
      slug: 'sample-skills-workshop',
      title: 'Sample Skills Workshop',
    },
    batch: {
      id: 'tbatch_003',
      name: 'Skills Workshop — Morning Group',
      studentsEnrolled: 12,
    },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    startsAt: '2026-07-15T09:00:00.000Z',
    endsAt: '2026-07-15T09:45:00.000Z',
    durationMinutes: 45,
    status: 'completed',
    meeting: { provider: 'Microsoft Teams', status: 'ended', meetingUrl: null },
    attendance: {
      totalStudents: 12,
      present: 10,
      absent: 2,
      attendancePercent: 83,
    },
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-15T10:05:00.000Z',
  },
  {
    id: 'live_session_004',
    title: 'Leadership Practice Lab',
    course: {
      id: 'tcourse_004',
      slug: 'sample-leadership-program',
      title: 'Sample Leadership Program',
    },
    batch: {
      id: 'tbatch_004',
      name: 'Leadership Program — Weekday Cohort',
      studentsEnrolled: 16,
    },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    startsAt: '2026-07-21T08:30:00.000Z',
    endsAt: '2026-07-21T09:30:00.000Z',
    durationMinutes: 60,
    status: 'scheduled',
    meeting: { provider: 'Google Meet', status: 'setup_pending', meetingUrl: null },
    attendance: {
      totalStudents: 16,
      present: 0,
      absent: 0,
      attendancePercent: null,
    },
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-16T12:10:00.000Z',
  },
  {
    id: 'live_session_005',
    title: 'Communication Clinic',
    course: {
      id: 'tcourse_005',
      slug: 'sample-communication-course',
      title: 'Sample Communication Course',
    },
    batch: {
      id: 'tbatch_005',
      name: 'Communication Course — Afternoon Group',
      studentsEnrolled: 10,
    },
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    startsAt: '2026-07-16T13:00:00.000Z',
    endsAt: '2026-07-16T14:00:00.000Z',
    durationMinutes: 60,
    status: 'cancelled',
    meeting: { provider: 'Zoom', status: 'cancelled', meetingUrl: null },
    attendance: {
      totalStudents: 10,
      present: 0,
      absent: 0,
      attendancePercent: null,
    },
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-15T15:00:00.000Z',
  },
];

export function getTeacherLiveClassStats(
  sessions: TeacherLiveClassDto[],
): TeacherLiveClassStatDto[] {
  const scheduled = sessions.filter((session) => session.status === 'scheduled').length;
  const live = sessions.filter((session) => session.status === 'live').length;
  const completed = sessions.filter((session) => session.status === 'completed').length;
  const students = sessions.reduce(
    (total, session) => total + session.batch.studentsEnrolled,
    0,
  );

  return [
    {
      id: 'upcoming-classes',
      label: 'Upcoming Classes',
      value: String(scheduled),
      helper: 'Scheduled teaching sessions.',
    },
    {
      id: 'live-now',
      label: 'Live Now',
      value: String(live),
      helper: 'Sessions currently marked live.',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: String(completed),
      helper: 'Completed live class sessions.',
    },
    {
      id: 'total-students',
      label: 'Total Students',
      value: String(students),
      helper: 'Enrollment seats across listed classes.',
    },
  ];
}

export function filterTeacherLiveClasses(
  sessions: TeacherLiveClassDto[],
  query: string,
  status: TeacherLiveClassStatusFilter,
): TeacherLiveClassDto[] {
  const normalized = query.trim().toLowerCase();

  return sessions.filter((session) => {
    if (status !== 'all' && session.status !== status) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      session.title.toLowerCase().includes(normalized) ||
      session.course.title.toLowerCase().includes(normalized) ||
      session.course.slug.toLowerCase().includes(normalized) ||
      session.batch.name.toLowerCase().includes(normalized)
    );
  });
}

export function sortTeacherLiveClasses(
  sessions: TeacherLiveClassDto[],
  sort: TeacherLiveClassSortOption,
): TeacherLiveClassDto[] {
  const next = [...sessions];

  switch (sort) {
    case 'recently_updated':
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    case 'alphabetical':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'upcoming':
    default:
      return next.sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }
}

export function getTeacherLiveClassById(
  sessions: TeacherLiveClassDto[],
  id: string,
): TeacherLiveClassDto | null {
  return sessions.find((session) => session.id === id) ?? null;
}

export function formatTeacherLiveClassDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso);
}
