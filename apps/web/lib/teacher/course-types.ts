import { formatDashboardDate } from '../dashboard/format-date';

/**
 * Teacher Courses view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type TeacherCourseStatus = 'published' | 'draft' | 'archived';
export type TeacherCoursesViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherCourseStatusFilter = 'all' | TeacherCourseStatus;
export type TeacherCourseSortOption = 'newest' | 'recently_updated' | 'alphabetical';
export type TeacherCoursesViewMode = 'grid' | 'list';

export interface TeacherCourseMediaDto {
  thumbnailUrl: string | null;
  thumbnailAlt: string;
}

/** Aggregate counts — defaulted until dedicated rollup endpoints exist. */
export interface TeacherCourseCountsDto {
  batches: number;
  students: number;
  lessons: number;
  assignments: number;
}

/** List-item DTO for the teacher course workspace. */
export interface TeacherCourseSummaryDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: TeacherCourseStatus;
  isPublished: boolean;
  media: TeacherCourseMediaDto;
  counts: TeacherCourseCountsDto;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherCourseStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherCoursesPageCopy = {
  title: 'Courses',
  description: 'Your teaching workspace — manage the programs you deliver.',
  searchPlaceholder: 'Search courses by name',
  searchLabel: 'Search courses',
  statusFilterLabel: 'Filter by status',
  sortLabel: 'Sort courses',
  viewModeLabel: 'Course view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  gridLabel: 'Your courses',
  emptyTitle: 'No courses yet',
  emptyDescription: 'Courses you create will appear here. Course creation opens in a later sprint.',
  noMatchesTitle: 'No matching courses',
  noMatchesDescription: 'Try a different search term or status filter.',
  errorTitle: 'Unable to load your courses',
  errorDescription: 'Something went wrong while loading Courses. Please try again.',
  viewButton: 'View',
  manageButton: 'Manage',
  analyticsButton: 'Analytics',
  comingSoonNote: 'Course actions activate in a later sprint.',
  batchesLabel: 'Batches',
  studentsLabel: 'Students',
  lessonsLabel: 'Lessons',
  assignmentsLabel: 'Assignments',
  lastUpdatedLabel: 'Last updated',
  publishedLabel: 'Published',
  unpublishedLabel: 'Not published',
} as const;

export const teacherCourseStatusLabel: Record<TeacherCourseStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  archived: 'Archived',
};

export const teacherCourseStatusFilterOptions: {
  value: TeacherCourseStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

export const teacherCourseSortOptions: { value: TeacherCourseSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export function getTeacherCourseStats(courses: TeacherCourseSummaryDto[]): TeacherCourseStatDto[] {
  const active = courses.filter((course) => course.status === 'published').length;
  const drafts = courses.filter((course) => course.status === 'draft').length;
  const students = courses.reduce((sum, course) => sum + course.counts.students, 0);
  const batches = courses.reduce((sum, course) => sum + course.counts.batches, 0);

  return [
    {
      id: 'active-courses',
      label: 'Active Courses',
      value: String(active),
      helper: 'Published programs students can access.',
    },
    {
      id: 'draft-courses',
      label: 'Draft Courses',
      value: String(drafts),
      helper: 'Unpublished programs in preparation.',
    },
    {
      id: 'students',
      label: 'Students',
      value: String(students),
      helper: 'Learners across your courses.',
    },
    {
      id: 'batches',
      label: 'Batches',
      value: String(batches),
      helper: 'Cohorts across your courses.',
    },
  ];
}

export function formatTeacherCourseDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

/** Maps UI sort option → NestJS list query params. */
export function toCourseListSort(sort: TeacherCourseSortOption): {
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'alphabetical':
      return { sortBy: 'title', sortOrder: 'asc' };
    case 'recently_updated':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'newest':
    default:
      return { sortBy: 'createdAt', sortOrder: 'desc' };
  }
}

/** Maps UI status filter → NestJS status enum (undefined = all). */
export function toCourseApiStatus(
  status: TeacherCourseStatusFilter,
): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined {
  switch (status) {
    case 'draft':
      return 'DRAFT';
    case 'published':
      return 'PUBLISHED';
    case 'archived':
      return 'ARCHIVED';
    case 'all':
    default:
      return undefined;
  }
}
