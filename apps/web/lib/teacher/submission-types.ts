import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Submission view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type TeacherSubmissionStatus = 'pending' | 'submitted' | 'graded' | 'returned' | 'late';
export type TeacherSubmissionsViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherSubmissionStatusFilter = 'all' | TeacherSubmissionStatus;
export type TeacherSubmissionSortOption =
  'recently_updated' | 'submitted_at' | 'score' | 'alphabetical';
export type TeacherSubmissionsViewMode = 'grid' | 'list';

export interface TeacherSubmissionAssignmentRefDto {
  id: string;
  title: string;
  course: {
    id: string;
    slug: string;
    title: string;
  };
  maxScore: number | null;
}

export interface TeacherSubmissionStudentRefDto {
  id: string;
  fullName: string;
  initials: string;
  /** Always null until student profile media is available. */
  avatarUrl: null;
}

export interface TeacherSubmissionAttachmentDto {
  id: string;
  label: string;
  kind: string;
}

export interface TeacherSubmissionGraderRefDto {
  id: string;
  name: string;
}

/** List/detail DTO for the teacher submissions workspace. */
export interface TeacherSubmissionSummaryDto {
  id: string;
  assignment: TeacherSubmissionAssignmentRefDto;
  student: TeacherSubmissionStudentRefDto;
  status: TeacherSubmissionStatus;
  content: string | null;
  attachments: TeacherSubmissionAttachmentDto[];
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  grader: TeacherSubmissionGraderRefDto | null;
  updatedAt: string;
}

export interface TeacherSubmissionStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherSubmissionsPageCopy = {
  title: 'Submissions',
  description: 'Review and grade student submissions across your assignments.',
  searchPlaceholder: 'Search students or assignments',
  searchLabel: 'Search submissions',
  statusFilterLabel: 'Filter by submission status',
  assignmentFilterLabel: 'Filter by assignment',
  sortLabel: 'Sort submissions',
  viewModeLabel: 'Submission view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  collectionLabel: 'Submissions',
  allAssignmentsLabel: 'All Assignments',
  emptyTitle: 'No submissions yet',
  emptyDescription: 'Student submissions will appear here once learners turn in assignment work.',
  noMatchesTitle: 'No matching submissions',
  noMatchesDescription: 'Try a different student, assignment, or status filter.',
  errorTitle: 'Unable to load submissions',
  errorDescription: 'Something went wrong while loading Submissions. Please try again.',
  assignmentLabel: 'Assignment',
  courseLabel: 'Course',
  studentLabel: 'Student',
  statusLabel: 'Status',
  scoreLabel: 'Score',
  maxScoreLabel: 'Max Score',
  feedbackLabel: 'Feedback',
  submittedAtLabel: 'Submitted',
  gradedAtLabel: 'Graded',
  graderLabel: 'Graded by',
  lastUpdatedLabel: 'Last Updated',
  notSubmittedLabel: 'Not submitted yet',
  notGradedLabel: 'Not graded yet',
  noScoreLabel: '—',
  detailsButton: 'View details',
  gradeButton: 'Grade',
  returnButton: 'Return',
  comingSoonNote: 'Grading actions activate in a later sprint.',
  detailsPanelLabel: 'Submission details',
  detailsCloseLabel: 'Close submission details',
  submissionInfoLabel: 'Submission information',
  contentLabel: 'Content',
  attachmentsLabel: 'Attachments',
  attachmentsPlaceholder: 'No files are attached to this submission.',
  gradingLabel: 'Grading',
  emptyContentLabel: 'No written content submitted.',
} as const;

export const teacherSubmissionStatusLabel: Record<TeacherSubmissionStatus, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  graded: 'Graded',
  returned: 'Returned',
  late: 'Late',
};

export const teacherSubmissionStatusFilterOptions: {
  value: TeacherSubmissionStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'late', label: 'Late' },
  { value: 'graded', label: 'Graded' },
  { value: 'returned', label: 'Returned' },
];

export const teacherSubmissionSortOptions: {
  value: TeacherSubmissionSortOption;
  label: string;
}[] = [
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'submitted_at', label: 'Submitted Date' },
  { value: 'score', label: 'Score' },
  { value: 'alphabetical', label: 'Student Name' },
];

export function getTeacherSubmissionStats(
  submissions: TeacherSubmissionSummaryDto[],
): TeacherSubmissionStatDto[] {
  const awaiting = submissions.filter(
    (item) => item.status === 'submitted' || item.status === 'late',
  ).length;
  const graded = submissions.filter((item) => item.status === 'graded').length;
  const late = submissions.filter((item) => item.status === 'late').length;
  const returned = submissions.filter((item) => item.status === 'returned').length;

  return [
    {
      id: 'awaiting-review',
      label: 'Awaiting Review',
      value: String(awaiting),
      helper: 'Submitted or late submissions needing grading.',
    },
    {
      id: 'graded',
      label: 'Graded',
      value: String(graded),
      helper: 'Submissions already graded.',
    },
    {
      id: 'late',
      label: 'Late',
      value: String(late),
      helper: 'Submissions marked late.',
    },
    {
      id: 'returned',
      label: 'Returned',
      value: String(returned),
      helper: 'Submissions returned to students.',
    },
  ];
}

export function filterTeacherSubmissions(
  submissions: TeacherSubmissionSummaryDto[],
  query: string,
  status: TeacherSubmissionStatusFilter,
  options?: {
    assignmentId?: string;
  },
): TeacherSubmissionSummaryDto[] {
  const normalized = query.trim().toLowerCase();
  const assignmentId = options?.assignmentId ?? 'all';

  return submissions.filter((submission) => {
    if (status !== 'all' && submission.status !== status) {
      return false;
    }
    if (assignmentId !== 'all' && submission.assignment.id !== assignmentId) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      submission.student.fullName.toLowerCase().includes(normalized) ||
      submission.assignment.title.toLowerCase().includes(normalized) ||
      submission.assignment.course.title.toLowerCase().includes(normalized) ||
      submission.assignment.course.slug.toLowerCase().includes(normalized)
    );
  });
}

export function sortTeacherSubmissions(
  submissions: TeacherSubmissionSummaryDto[],
  sort: TeacherSubmissionSortOption,
): TeacherSubmissionSummaryDto[] {
  const next = [...submissions];

  switch (sort) {
    case 'submitted_at':
      return next.sort((a, b) => {
        const aTime =
          a.submittedAt === null ? Number.POSITIVE_INFINITY : new Date(a.submittedAt).getTime();
        const bTime =
          b.submittedAt === null ? Number.POSITIVE_INFINITY : new Date(b.submittedAt).getTime();
        return aTime - bTime;
      });
    case 'score':
      return next.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    case 'alphabetical':
      return next.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
    case 'recently_updated':
    default:
      return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

export function getTeacherSubmissionById(
  submissions: TeacherSubmissionSummaryDto[],
  id: string,
): TeacherSubmissionSummaryDto | null {
  return submissions.find((submission) => submission.id === id) ?? null;
}

export function formatTeacherSubmissionDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

export function formatTeacherSubmissionDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso);
}

/** Maps UI sort to NestJS Submission list sort. */
export function toSubmissionListSort(sort: TeacherSubmissionSortOption): {
  sortBy: 'createdAt' | 'updatedAt' | 'submittedAt' | 'status' | 'score';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'submitted_at':
      return { sortBy: 'submittedAt', sortOrder: 'asc' };
    case 'score':
      return { sortBy: 'score', sortOrder: 'desc' };
    case 'alphabetical':
      return { sortBy: 'status', sortOrder: 'asc' };
    case 'recently_updated':
    default:
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
  }
}

/** Maps UI status filter to NestJS SubmissionStatus. */
export function toSubmissionApiStatus(
  status: TeacherSubmissionStatusFilter,
): 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RETURNED' | 'LATE' | undefined {
  switch (status) {
    case 'pending':
      return 'PENDING';
    case 'submitted':
      return 'SUBMITTED';
    case 'graded':
      return 'GRADED';
    case 'returned':
      return 'RETURNED';
    case 'late':
      return 'LATE';
    case 'all':
    default:
      return undefined;
  }
}
