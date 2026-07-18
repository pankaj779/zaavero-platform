import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Assignment view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type TeacherAssignmentStatus = 'draft' | 'published' | 'closed' | 'archived';
export type TeacherAssignmentsViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherAssignmentStatusFilter = 'all' | TeacherAssignmentStatus;
export type TeacherAssignmentSortOption = 'recently_updated' | 'due_date' | 'alphabetical';
export type TeacherAssignmentsViewMode = 'grid' | 'list';
export type TeacherIntegrationAvailability = 'coming_soon';

export interface TeacherAssignmentCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface TeacherAssignmentBatchRefDto {
  id: string;
  name: string;
  studentsEnrolled: number;
}

/** Submission attachment metadata returned by the API. */
export interface TeacherAssignmentAttachmentDto {
  id: string;
  label: string;
  kind: string;
}

/** Submission rollup — placeholders until Submission API rollups exist. */
export interface TeacherAssignmentSubmissionSummaryDto {
  totalStudents: number;
  submitted: number;
  pending: number;
  graded: number;
  /** Null until the assignment is published and submissions open. */
  submissionRate: number | null;
}

export interface TeacherAssignmentGradingSummaryDto {
  graded: number;
  awaitingReview: number;
  averageScore: number | null;
  maxScore: number;
}

export interface TeacherAssignmentTimelineEventDto {
  id: string;
  label: string;
  at: string;
}

export interface TeacherAssignmentIntegrationsDto {
  plagiarismDetection: TeacherIntegrationAvailability;
  aiEvaluation: TeacherIntegrationAvailability;
  rubricGrading: TeacherIntegrationAvailability;
  notifications: TeacherIntegrationAvailability;
}

/** List/detail DTO for the teacher assignments workspace. */
export interface TeacherAssignmentDto {
  id: string;
  title: string;
  course: TeacherAssignmentCourseRefDto;
  batches: TeacherAssignmentBatchRefDto[];
  status: TeacherAssignmentStatus;
  dueAt: string | null;
  submissions: TeacherAssignmentSubmissionSummaryDto;
  grading: TeacherAssignmentGradingSummaryDto;
  attachments: TeacherAssignmentAttachmentDto[];
  timeline: TeacherAssignmentTimelineEventDto[];
  integrations: TeacherAssignmentIntegrationsDto;
  updatedAt: string;
}

/** Alias matching the sprint naming — same shape as TeacherAssignmentDto. */
export type TeacherAssignmentSummaryDto = TeacherAssignmentDto;

export interface TeacherAssignmentStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherAssignmentsPageCopy = {
  title: 'Assignments',
  description: 'Manage assignments across your courses and batches.',
  searchPlaceholder: 'Search assignments, courses, or batches',
  searchLabel: 'Search assignments',
  statusFilterLabel: 'Filter by assignment status',
  courseFilterLabel: 'Filter by course',
  batchFilterLabel: 'Filter by batch',
  sortLabel: 'Sort assignments',
  viewModeLabel: 'Assignment view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  collectionLabel: 'Assignments',
  allCoursesLabel: 'All Courses',
  allBatchesLabel: 'All Batches',
  createButton: 'Create Assignment',
  emptyTitle: 'No assignments yet',
  emptyDescription:
    'Assignments you create will appear here. Authoring tools arrive in a later sprint.',
  noMatchesTitle: 'No matching assignments',
  noMatchesDescription: 'Try a different title, course, batch, or status filter.',
  errorTitle: 'Unable to load assignments',
  errorDescription: 'Something went wrong while loading Assignments. Please try again.',
  courseLabel: 'Course',
  batchLabel: 'Batch',
  batchesLabel: 'Batches',
  statusLabel: 'Status',
  dueDateLabel: 'Due Date',
  noDueDateLabel: 'No due date',
  totalStudentsLabel: 'Total Students',
  submittedLabel: 'Submitted',
  pendingLabel: 'Pending',
  gradedLabel: 'Graded',
  lastUpdatedLabel: 'Last Updated',
  submissionRateLabel: 'Submission Rate',
  notRecordedLabel: 'Not recorded yet',
  detailsButton: 'View details',
  editButton: 'Edit',
  reviewButton: 'Review Submissions',
  publishButton: 'Publish',
  archiveButton: 'Archive',
  analyticsButton: 'Analytics',
  comingSoonNote: 'Assignment actions are Coming Soon.',
  detailsPanelLabel: 'Assignment details',
  detailsCloseLabel: 'Close assignment details',
  assignmentInfoLabel: 'Assignment information',
  batchListLabel: 'Batch list',
  submissionSummaryLabel: 'Submission summary',
  gradingSummaryLabel: 'Grading summary',
  timelineLabel: 'Timeline',
  attachmentsLabel: 'Submission files',
  attachmentsPlaceholder: 'No submission files are attached.',
  futureIntegrationsLabel: 'Future integrations',
  awaitingReviewLabel: 'Awaiting Review',
  averageScoreLabel: 'Average Score',
  maxScoreLabel: 'Max Score',
} as const;

export const teacherAssignmentStatusLabel: Record<TeacherAssignmentStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
  archived: 'Archived',
};

export const teacherAssignmentStatusFilterOptions: {
  value: TeacherAssignmentStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

export const teacherAssignmentSortOptions: {
  value: TeacherAssignmentSortOption;
  label: string;
}[] = [
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

/** Top stats derived from the assignment list — mirrors a future aggregate endpoint. */
export function getTeacherAssignmentStats(
  assignments: TeacherAssignmentDto[],
): TeacherAssignmentStatDto[] {
  const active = assignments.filter((item) => item.status === 'published').length;
  const pendingReviews = assignments.reduce((sum, item) => sum + item.grading.awaitingReview, 0);
  const graded = assignments.reduce((sum, item) => sum + item.submissions.graded, 0);
  const rates = assignments
    .map((item) => item.submissions.submissionRate)
    .filter((value): value is number => value !== null);
  const submissionRate =
    rates.length === 0
      ? null
      : Math.round(rates.reduce((sum, value) => sum + value, 0) / rates.length);

  return [
    {
      id: 'active-assignments',
      label: 'Active Assignments',
      value: String(active),
      helper: 'Published assignments open to students.',
    },
    {
      id: 'pending-reviews',
      label: 'Pending Reviews',
      value: String(pendingReviews),
      helper: 'Submissions awaiting grading.',
    },
    {
      id: 'graded',
      label: 'Graded',
      value: String(graded),
      helper: 'Graded submissions across assignments.',
    },
    {
      id: 'submission-rate',
      label: 'Submission Rate',
      value: submissionRate === null ? '—' : `${String(submissionRate)}%`,
      helper: 'Mean submission rate across published assignments.',
    },
  ];
}

export function filterTeacherAssignments(
  assignments: TeacherAssignmentDto[],
  query: string,
  status: TeacherAssignmentStatusFilter,
  options?: {
    courseId?: string;
    batchId?: string;
  },
): TeacherAssignmentDto[] {
  const normalized = query.trim().toLowerCase();
  const courseId = options?.courseId ?? 'all';
  const batchId = options?.batchId ?? 'all';

  return assignments.filter((assignment) => {
    if (status !== 'all' && assignment.status !== status) {
      return false;
    }
    if (courseId !== 'all' && assignment.course.id !== courseId) {
      return false;
    }
    if (batchId !== 'all' && !assignment.batches.some((batch) => batch.id === batchId)) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      assignment.title.toLowerCase().includes(normalized) ||
      assignment.course.title.toLowerCase().includes(normalized) ||
      assignment.course.slug.toLowerCase().includes(normalized) ||
      assignment.batches.some((batch) => batch.name.toLowerCase().includes(normalized))
    );
  });
}

export function sortTeacherAssignments(
  assignments: TeacherAssignmentDto[],
  sort: TeacherAssignmentSortOption,
): TeacherAssignmentDto[] {
  const next = [...assignments];

  switch (sort) {
    case 'due_date':
      return next.sort((a, b) => {
        const aTime = a.dueAt === null ? Number.POSITIVE_INFINITY : new Date(a.dueAt).getTime();
        const bTime = b.dueAt === null ? Number.POSITIVE_INFINITY : new Date(b.dueAt).getTime();
        return aTime - bTime;
      });
    case 'alphabetical':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'recently_updated':
    default:
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

export function getTeacherAssignmentById(
  assignments: TeacherAssignmentDto[],
  id: string,
): TeacherAssignmentDto | null {
  return assignments.find((assignment) => assignment.id === id) ?? null;
}

export function formatTeacherAssignmentDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

export function formatTeacherAssignmentDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso);
}

/** Maps UI sort to NestJS Assignment list sort. */
export function toAssignmentListSort(sort: TeacherAssignmentSortOption): {
  sortBy: 'createdAt' | 'updatedAt' | 'dueAt' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'due_date':
      return { sortBy: 'dueAt', sortOrder: 'asc' };
    case 'alphabetical':
      return { sortBy: 'title', sortOrder: 'asc' };
    case 'recently_updated':
    default:
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
  }
}

/** Maps UI status filter to NestJS AssignmentStatus. */
export function toAssignmentApiStatus(
  status: TeacherAssignmentStatusFilter,
): 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED' | undefined {
  switch (status) {
    case 'draft':
      return 'DRAFT';
    case 'published':
      return 'PUBLISHED';
    case 'closed':
      return 'CLOSED';
    case 'archived':
      return 'ARCHIVED';
    case 'all':
    default:
      return undefined;
  }
}
