import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Assignment DTOs — shaped like future GET /assignments responses.
 * An assignment belongs to a course and is assigned to one or more batches.
 * Submission files stay placeholder metadata and grading/plagiarism/AI fields
 * remain opaque so later integrations attach without remodeling. Graphology is
 * one sample course only.
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

/** Placeholder submission attachment metadata — never a real file/URL. */
export interface TeacherAssignmentAttachmentDto {
  id: string;
  label: string;
  kind: string;
}

/** Backend-shaped submission rollup — no client-side computation. */
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

export interface TeacherAssignmentStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherAssignmentsViewState: TeacherAssignmentsViewState = 'populated';

export const teacherAssignmentsPageCopy = {
  title: 'Assignments',
  description: 'Manage assignments across your courses and batches.',
  searchPlaceholder: 'Search assignments, courses, or batches',
  searchLabel: 'Search assignments',
  statusFilterLabel: 'Filter by assignment status',
  sortLabel: 'Sort assignments',
  viewModeLabel: 'Assignment view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  collectionLabel: 'Assignments',
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
  attachmentsPlaceholder: 'Submission files are placeholders until storage is integrated.',
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

const comingSoonIntegrations: TeacherAssignmentIntegrationsDto = {
  plagiarismDetection: 'coming_soon',
  aiEvaluation: 'coming_soon',
  rubricGrading: 'coming_soon',
  notifications: 'coming_soon',
};

const placeholderAttachments: TeacherAssignmentAttachmentDto[] = [
  { id: 'attachment_placeholder_1', label: 'Submission attachment placeholder', kind: 'document' },
];

/**
 * Course-agnostic sample assignments. Graphology appears once; other programs
 * demonstrate the model supports unrelated courses. Shape mirrors a future
 * GET /assignments response item.
 */
export const teacherAssignments: TeacherAssignmentDto[] = [
  {
    id: 'assignment_001',
    title: 'Foundations Reflection Essay',
    course: {
      id: 'tcourse_001',
      slug: 'graphology-foundation',
      title: 'Graphology Foundations',
    },
    batches: [
      { id: 'tbatch_001', name: 'Graphology Foundations — Weekend Cohort', studentsEnrolled: 18 },
    ],
    status: 'published',
    dueAt: '2026-07-24T18:30:00.000Z',
    submissions: {
      totalStudents: 18,
      submitted: 12,
      pending: 6,
      graded: 8,
      submissionRate: 67,
    },
    grading: { graded: 8, awaitingReview: 4, averageScore: 78, maxScore: 100 },
    attachments: placeholderAttachments,
    timeline: [
      { id: 'created', label: 'Created', at: '2026-07-10T09:00:00.000Z' },
      { id: 'published', label: 'Published', at: '2026-07-12T09:00:00.000Z' },
    ],
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-16T11:20:00.000Z',
  },
  {
    id: 'assignment_002',
    title: 'Advanced Program Case Study',
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    batches: [
      { id: 'tbatch_002', name: 'Advanced Program — Evening Cohort', studentsEnrolled: 14 },
      { id: 'tbatch_006', name: 'Advanced Program — Weekend Cohort', studentsEnrolled: 12 },
    ],
    status: 'published',
    dueAt: '2026-07-20T18:30:00.000Z',
    submissions: {
      totalStudents: 26,
      submitted: 20,
      pending: 6,
      graded: 5,
      submissionRate: 77,
    },
    grading: { graded: 5, awaitingReview: 15, averageScore: 71, maxScore: 100 },
    attachments: placeholderAttachments,
    timeline: [
      { id: 'created', label: 'Created', at: '2026-07-05T10:00:00.000Z' },
      { id: 'published', label: 'Published', at: '2026-07-08T10:00:00.000Z' },
    ],
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-17T08:45:00.000Z',
  },
  {
    id: 'assignment_003',
    title: 'Skills Workshop Practice Set',
    course: {
      id: 'tcourse_003',
      slug: 'sample-skills-workshop',
      title: 'Sample Skills Workshop',
    },
    batches: [
      { id: 'tbatch_003', name: 'Skills Workshop — Morning Group', studentsEnrolled: 12 },
    ],
    status: 'draft',
    dueAt: null,
    submissions: {
      totalStudents: 12,
      submitted: 0,
      pending: 12,
      graded: 0,
      submissionRate: null,
    },
    grading: { graded: 0, awaitingReview: 0, averageScore: null, maxScore: 50 },
    attachments: placeholderAttachments,
    timeline: [{ id: 'created', label: 'Created', at: '2026-07-15T14:00:00.000Z' }],
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-15T14:00:00.000Z',
  },
  {
    id: 'assignment_004',
    title: 'Leadership Program Final Project',
    course: {
      id: 'tcourse_004',
      slug: 'sample-leadership-program',
      title: 'Sample Leadership Program',
    },
    batches: [
      { id: 'tbatch_004', name: 'Leadership Program — Weekday Cohort', studentsEnrolled: 16 },
    ],
    status: 'closed',
    dueAt: '2026-06-30T18:30:00.000Z',
    submissions: {
      totalStudents: 16,
      submitted: 16,
      pending: 0,
      graded: 16,
      submissionRate: 100,
    },
    grading: { graded: 16, awaitingReview: 0, averageScore: 84, maxScore: 100 },
    attachments: placeholderAttachments,
    timeline: [
      { id: 'created', label: 'Created', at: '2026-06-01T09:00:00.000Z' },
      { id: 'published', label: 'Published', at: '2026-06-03T09:00:00.000Z' },
      { id: 'closed', label: 'Closed', at: '2026-07-01T09:00:00.000Z' },
    ],
    integrations: comingSoonIntegrations,
    updatedAt: '2026-07-02T10:15:00.000Z',
  },
  {
    id: 'assignment_005',
    title: 'Communication Course Reflection',
    course: {
      id: 'tcourse_005',
      slug: 'sample-communication-course',
      title: 'Sample Communication Course',
    },
    batches: [
      { id: 'tbatch_005', name: 'Communication Course — Afternoon Group', studentsEnrolled: 10 },
    ],
    status: 'archived',
    dueAt: '2026-05-20T18:30:00.000Z',
    submissions: {
      totalStudents: 10,
      submitted: 9,
      pending: 1,
      graded: 9,
      submissionRate: 90,
    },
    grading: { graded: 9, awaitingReview: 0, averageScore: 76, maxScore: 100 },
    attachments: placeholderAttachments,
    timeline: [
      { id: 'created', label: 'Created', at: '2026-05-01T09:00:00.000Z' },
      { id: 'published', label: 'Published', at: '2026-05-03T09:00:00.000Z' },
      { id: 'archived', label: 'Archived', at: '2026-06-01T09:00:00.000Z' },
    ],
    integrations: comingSoonIntegrations,
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
];

/** Top stats derived from the mock list — mirrors a future aggregate endpoint. */
export function getTeacherAssignmentStats(
  assignments: TeacherAssignmentDto[],
): TeacherAssignmentStatDto[] {
  const active = assignments.filter((item) => item.status === 'published').length;
  const pendingReviews = assignments.reduce(
    (sum, item) => sum + item.grading.awaitingReview,
    0,
  );
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
): TeacherAssignmentDto[] {
  const normalized = query.trim().toLowerCase();

  return assignments.filter((assignment) => {
    if (status !== 'all' && assignment.status !== status) {
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
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
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
