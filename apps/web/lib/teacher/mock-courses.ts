import { formatDashboardDate } from '../dashboard/format-date';

/**
 * Teacher Courses DTOs — shaped like future GET /teachers/me/courses responses.
 * Course entities are generic and course-agnostic: Graphology titles below are
 * sample content only, never architecture. Unlimited future courses must fit
 * this shape without changes.
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

/** Aggregate counts matching future backend rollups — no client-side business logic. */
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

/** Controls which Courses UI state is shown in this sprint. */
export const teacherCoursesViewState: TeacherCoursesViewState = 'populated';

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
  emptyDescription:
    'Courses you create will appear here. Course creation opens in a later sprint.',
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

/**
 * Sample teaching catalog — Graphology is one sample program among generic ones.
 * Shape mirrors future GET /teachers/me/courses response items.
 */
export const teacherCourses: TeacherCourseSummaryDto[] = [
  {
    id: 'tcourse_001',
    slug: 'graphology-foundation',
    title: 'Graphology Foundations',
    description: 'Course description placeholder for this foundations program.',
    status: 'published',
    isPublished: true,
    media: { thumbnailUrl: null, thumbnailAlt: 'Course thumbnail placeholder' },
    counts: { batches: 2, students: 34, lessons: 12, assignments: 4 },
    createdAt: '2026-05-02T09:00:00.000Z',
    updatedAt: '2026-07-12T10:30:00.000Z',
  },
  {
    id: 'tcourse_002',
    slug: 'sample-advanced-program',
    title: 'Sample Advanced Program',
    description: 'Course description placeholder for an advanced-level program.',
    status: 'published',
    isPublished: true,
    media: { thumbnailUrl: null, thumbnailAlt: 'Course thumbnail placeholder' },
    counts: { batches: 1, students: 18, lessons: 16, assignments: 6 },
    createdAt: '2026-06-10T09:00:00.000Z',
    updatedAt: '2026-07-14T08:15:00.000Z',
  },
  {
    id: 'tcourse_003',
    slug: 'sample-skills-workshop',
    title: 'Sample Skills Workshop',
    description: 'Course description placeholder for a practical skills workshop.',
    status: 'draft',
    isPublished: false,
    media: { thumbnailUrl: null, thumbnailAlt: 'Course thumbnail placeholder' },
    counts: { batches: 0, students: 0, lessons: 5, assignments: 1 },
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-15T16:45:00.000Z',
  },
  {
    id: 'tcourse_004',
    slug: 'sample-retired-program',
    title: 'Sample Retired Program',
    description: 'Course description placeholder for an archived program.',
    status: 'archived',
    isPublished: false,
    media: { thumbnailUrl: null, thumbnailAlt: 'Course thumbnail placeholder' },
    counts: { batches: 1, students: 22, lessons: 10, assignments: 3 },
    createdAt: '2026-03-15T09:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
  },
];

/** Top stats derived from the mock list — mirrors a future aggregate endpoint. */
export function getTeacherCourseStats(
  courses: TeacherCourseSummaryDto[],
): TeacherCourseStatDto[] {
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

export function filterTeacherCourses(
  courses: TeacherCourseSummaryDto[],
  query: string,
  status: TeacherCourseStatusFilter,
): TeacherCourseSummaryDto[] {
  const normalized = query.trim().toLowerCase();

  return courses.filter((course) => {
    const matchesStatus = status === 'all' || course.status === status;
    if (!matchesStatus) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      course.title.toLowerCase().includes(normalized) ||
      course.slug.toLowerCase().includes(normalized)
    );
  });
}

export function sortTeacherCourses(
  courses: TeacherCourseSummaryDto[],
  sort: TeacherCourseSortOption,
): TeacherCourseSummaryDto[] {
  const next = [...courses];

  switch (sort) {
    case 'alphabetical':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'recently_updated':
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    case 'newest':
    default:
      return next.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function formatTeacherCourseDate(iso: string | null): string {
  return formatDashboardDate(iso);
}
