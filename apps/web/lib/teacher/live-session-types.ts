import { formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Live Classes view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type TeacherLiveClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type TeacherMeetingProvider = 'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Sandbox';
export type TeacherMeetingStatus =
  'setup_pending' | 'ready' | 'in_progress' | 'ended' | 'cancelled';
export type TeacherLiveClassesViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherLiveClassStatusFilter = 'all' | TeacherLiveClassStatus;
export type TeacherLiveClassSortOption = 'upcoming' | 'recently_updated' | 'alphabetical';
export type TeacherLiveClassesViewMode = 'grid' | 'list';
export type TeacherLiveClassProviderFilter = 'all' | TeacherMeetingProvider;
export type TeacherIntegrationAvailability = 'coming_soon' | 'available' | 'disabled';

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
  meetingUrl: string | null;
  hostUrl: string | null;
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

export const teacherLiveClassesPageCopy = {
  title: 'Live Classes',
  description: 'Schedule and manage live teaching sessions across your batches.',
  searchPlaceholder: 'Search sessions, courses, or batches',
  searchLabel: 'Search live classes',
  statusFilterLabel: 'Filter by live class status',
  courseFilterLabel: 'Filter by course',
  batchFilterLabel: 'Filter by batch',
  providerFilterLabel: 'Filter by meeting provider',
  sortLabel: 'Sort live classes',
  viewModeLabel: 'Live class view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  collectionLabel: 'Live classes',
  allCoursesLabel: 'All Courses',
  allBatchesLabel: 'All Batches',
  allProvidersLabel: 'All Providers',
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
  comingSoonNote: 'Attendance editing and recording tools arrive in a later sprint.',
  joinHostHint: 'Opens the host meeting link in a new tab.',
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

export const teacherLiveClassProviderFilterOptions: {
  value: TeacherLiveClassProviderFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Providers' },
  { value: 'Zoom', label: 'Zoom' },
  { value: 'Google Meet', label: 'Google Meet' },
  { value: 'Microsoft Teams', label: 'Microsoft Teams' },
];

export const teacherLiveClassSortOptions: {
  value: TeacherLiveClassSortOption;
  label: string;
}[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export function getTeacherLiveClassStats(
  sessions: TeacherLiveClassDto[],
): TeacherLiveClassStatDto[] {
  const scheduled = sessions.filter((session) => session.status === 'scheduled').length;
  const live = sessions.filter((session) => session.status === 'live').length;
  const completed = sessions.filter((session) => session.status === 'completed').length;
  const students = sessions.reduce((total, session) => total + session.batch.studentsEnrolled, 0);

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

/** Client-side helpers kept for workspace filtering when needed. */
export function filterTeacherLiveClasses(
  sessions: TeacherLiveClassDto[],
  query: string,
  status: TeacherLiveClassStatusFilter,
  options?: {
    courseId?: string;
    batchId?: string;
    provider?: TeacherLiveClassProviderFilter;
  },
): TeacherLiveClassDto[] {
  const normalized = query.trim().toLowerCase();
  const courseId = options?.courseId;
  const batchId = options?.batchId;
  const provider = options?.provider ?? 'all';

  return sessions.filter((session) => {
    if (status !== 'all' && session.status !== status) {
      return false;
    }
    if (courseId && courseId !== 'all' && session.course.id !== courseId) {
      return false;
    }
    if (batchId && batchId !== 'all' && session.batch.id !== batchId) {
      return false;
    }
    if (provider !== 'all' && session.meeting.provider !== provider) {
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
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case 'alphabetical':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'upcoming':
    default:
      return next.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
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

export function toLiveSessionListSort(sort: TeacherLiveClassSortOption): {
  sortBy: 'startsAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'recently_updated':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'alphabetical':
      return { sortBy: 'title', sortOrder: 'asc' };
    case 'upcoming':
    default:
      return { sortBy: 'startsAt', sortOrder: 'asc' };
  }
}

export function toLiveSessionApiStatus(
  status: TeacherLiveClassStatusFilter,
): 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | undefined {
  switch (status) {
    case 'scheduled':
      return 'SCHEDULED';
    case 'live':
      return 'LIVE';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED';
    case 'all':
    default:
      return undefined;
  }
}

export function toLiveSessionApiProvider(
  provider: TeacherLiveClassProviderFilter,
): 'NONE' | 'ZOOM' | 'GOOGLE_MEET' | 'CUSTOM' | 'SANDBOX' | undefined {
  switch (provider) {
    case 'Zoom':
      return 'ZOOM';
    case 'Google Meet':
      return 'GOOGLE_MEET';
    case 'Microsoft Teams':
      return 'CUSTOM';
    case 'Sandbox':
      return 'SANDBOX';
    case 'all':
    default:
      return undefined;
  }
}
