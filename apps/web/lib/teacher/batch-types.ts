import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Batches view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type TeacherBatchStatus = 'active' | 'upcoming' | 'completed' | 'archived';
export type TeacherBatchesViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherBatchStatusFilter = 'all' | TeacherBatchStatus;
export type TeacherBatchSortOption = 'recently_updated' | 'start_date' | 'alphabetical';
export type TeacherBatchesViewMode = 'grid' | 'list';

export interface TeacherBatchMentorDto {
  id: string;
  name: string;
}

export interface TeacherBatchCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface TeacherBatchProgressDto {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

export interface TeacherBatchLiveClassDto {
  id: string;
  title: string;
  startsAt: string | null;
}

/** List-item DTO for the teacher batch workspace. */
export interface TeacherBatchSummaryDto {
  id: string;
  name: string;
  course: TeacherBatchCourseRefDto;
  status: TeacherBatchStatus;
  mentor: TeacherBatchMentorDto;
  studentsEnrolled: number;
  capacity: number;
  startDate: string;
  endDate: string;
  nextLiveClass: TeacherBatchLiveClassDto | null;
  progress: TeacherBatchProgressDto;
  updatedAt: string;
}

export interface TeacherBatchStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherBatchesPageCopy = {
  title: 'Batches',
  description: 'Live student groups for the courses you teach.',
  searchPlaceholder: 'Search batches or courses',
  searchLabel: 'Search batches',
  statusFilterLabel: 'Filter by batch status',
  sortLabel: 'Sort batches',
  viewModeLabel: 'Batch view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  gridLabel: 'Your batches',
  emptyTitle: 'No batches yet',
  emptyDescription:
    'Batches created for your courses will appear here. Batch management opens in a later sprint.',
  noMatchesTitle: 'No matching batches',
  noMatchesDescription: 'Try a different batch name, course name, or status filter.',
  errorTitle: 'Unable to load your batches',
  errorDescription: 'Something went wrong while loading Batches. Please try again.',
  viewButton: 'View',
  manageButton: 'Manage',
  attendanceButton: 'Attendance',
  analyticsButton: 'Analytics',
  comingSoonNote: 'Batch actions activate in a later sprint.',
  courseLabel: 'Course',
  mentorLabel: 'Mentor',
  studentsLabel: 'Students Enrolled',
  capacityLabel: 'Capacity',
  startDateLabel: 'Start Date',
  endDateLabel: 'End Date',
  nextLiveClassLabel: 'Next Live Class',
  noNextLiveClassLabel: 'No live class scheduled',
  progressLabel: 'Progress',
  lastUpdatedLabel: 'Last updated',
} as const;

export const teacherBatchStatusLabel: Record<TeacherBatchStatus, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  completed: 'Completed',
  archived: 'Archived',
};

export const teacherBatchStatusFilterOptions: {
  value: TeacherBatchStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export const teacherBatchSortOptions: { value: TeacherBatchSortOption; label: string }[] = [
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export function getTeacherBatchStats(batches: TeacherBatchSummaryDto[]): TeacherBatchStatDto[] {
  const active = batches.filter((batch) => batch.status === 'active').length;
  const upcoming = batches.filter((batch) => batch.status === 'upcoming').length;
  const completed = batches.filter((batch) => batch.status === 'completed').length;
  const students = batches.reduce((sum, batch) => sum + batch.studentsEnrolled, 0);

  return [
    {
      id: 'active-batches',
      label: 'Active Batches',
      value: String(active),
      helper: 'Live cohorts currently in progress.',
    },
    {
      id: 'upcoming-batches',
      label: 'Upcoming Batches',
      value: String(upcoming),
      helper: 'Cohorts scheduled to begin later.',
    },
    {
      id: 'completed-batches',
      label: 'Completed Batches',
      value: String(completed),
      helper: 'Cohorts that finished their schedule.',
    },
    {
      id: 'total-students',
      label: 'Total Students',
      value: String(students),
      helper: 'Students enrolled across these batches.',
    },
  ];
}

export function formatTeacherBatchDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

export function formatTeacherBatchDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso, teacherBatchesPageCopy.noNextLiveClassLabel);
}

/** Maps UI sort option → NestJS list query params. */
export function toBatchListSort(sort: TeacherBatchSortOption): {
  sortBy: 'updatedAt' | 'startDate' | 'name';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'alphabetical':
      return { sortBy: 'name', sortOrder: 'asc' };
    case 'start_date':
      return { sortBy: 'startDate', sortOrder: 'asc' };
    case 'recently_updated':
    default:
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
  }
}

/**
 * Maps UI status filter → NestJS status enum (undefined = all).
 * UI `archived` maps to API `CANCELLED` (closest backend equivalent).
 */
export function toBatchApiStatus(
  status: TeacherBatchStatusFilter,
): 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | undefined {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'upcoming':
      return 'UPCOMING';
    case 'completed':
      return 'COMPLETED';
    case 'archived':
      return 'CANCELLED';
    case 'all':
    default:
      return undefined;
  }
}
