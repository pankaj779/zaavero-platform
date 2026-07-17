import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Batches DTOs — shaped like future GET /teachers/me/batches responses.
 * A batch is a live group of students enrolled in one course. Course names below
 * are sample content only; the model is course-agnostic.
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

export const teacherBatchesViewState: TeacherBatchesViewState = 'populated';

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

export const teacherBatches: TeacherBatchSummaryDto[] = [
  {
    id: 'tbatch_001',
    name: 'Graphology Foundations — Weekend Cohort',
    course: {
      id: 'tcourse_001',
      slug: 'graphology-foundation',
      title: 'Graphology Foundations',
    },
    status: 'active',
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    studentsEnrolled: 18,
    capacity: 24,
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-09-30T00:00:00.000Z',
    nextLiveClass: {
      id: 'live_001',
      title: 'Session placeholder',
      startsAt: '2026-07-20T11:00:00.000Z',
    },
    progress: { completedLessons: 4, totalLessons: 12, percentage: 33 },
    updatedAt: '2026-07-15T10:00:00.000Z',
  },
  {
    id: 'tbatch_002',
    name: 'Advanced Program — Evening Cohort',
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    status: 'upcoming',
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    studentsEnrolled: 12,
    capacity: 20,
    startDate: '2026-08-05T00:00:00.000Z',
    endDate: '2026-11-05T00:00:00.000Z',
    nextLiveClass: {
      id: 'live_002',
      title: 'Orientation placeholder',
      startsAt: '2026-08-05T15:30:00.000Z',
    },
    progress: { completedLessons: 0, totalLessons: 16, percentage: 0 },
    updatedAt: '2026-07-14T14:30:00.000Z',
  },
  {
    id: 'tbatch_003',
    name: 'Skills Workshop — Morning Group',
    course: {
      id: 'tcourse_003',
      slug: 'sample-skills-workshop',
      title: 'Sample Skills Workshop',
    },
    status: 'completed',
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    studentsEnrolled: 16,
    capacity: 16,
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-05-15T00:00:00.000Z',
    nextLiveClass: null,
    progress: { completedLessons: 5, totalLessons: 5, percentage: 100 },
    updatedAt: '2026-05-16T09:00:00.000Z',
  },
  {
    id: 'tbatch_004',
    name: 'Retired Program — Archived Cohort',
    course: {
      id: 'tcourse_004',
      slug: 'sample-retired-program',
      title: 'Sample Retired Program',
    },
    status: 'archived',
    mentor: { id: 'teacher_placeholder', name: 'Teacher Placeholder' },
    studentsEnrolled: 20,
    capacity: 20,
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-04-30T00:00:00.000Z',
    nextLiveClass: null,
    progress: { completedLessons: 10, totalLessons: 10, percentage: 100 },
    updatedAt: '2026-06-01T12:00:00.000Z',
  },
];

export function getTeacherBatchStats(
  batches: TeacherBatchSummaryDto[],
): TeacherBatchStatDto[] {
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

export function filterTeacherBatches(
  batches: TeacherBatchSummaryDto[],
  query: string,
  status: TeacherBatchStatusFilter,
): TeacherBatchSummaryDto[] {
  const normalized = query.trim().toLowerCase();

  return batches.filter((batch) => {
    const matchesStatus = status === 'all' || batch.status === status;
    if (!matchesStatus) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      batch.name.toLowerCase().includes(normalized) ||
      batch.course.title.toLowerCase().includes(normalized) ||
      batch.course.slug.toLowerCase().includes(normalized)
    );
  });
}

export function sortTeacherBatches(
  batches: TeacherBatchSummaryDto[],
  sort: TeacherBatchSortOption,
): TeacherBatchSummaryDto[] {
  const next = [...batches];

  switch (sort) {
    case 'alphabetical':
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case 'start_date':
      return next.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
    case 'recently_updated':
    default:
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }
}

export function formatTeacherBatchDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

export function formatTeacherBatchDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso, teacherBatchesPageCopy.noNextLiveClassLabel);
}
