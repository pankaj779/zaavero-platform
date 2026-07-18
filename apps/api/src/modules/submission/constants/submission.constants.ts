export const SUBMISSION_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'submittedAt',
  'status',
  'score',
] as const;

export type SubmissionSortField = (typeof SUBMISSION_SORT_FIELDS)[number];

export const SUBMISSION_STATUSES = ['PENDING', 'SUBMITTED', 'GRADED', 'RETURNED', 'LATE'] as const;

export type SubmissionStatusValue = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_DEFAULT_PAGE = 1;
export const SUBMISSION_DEFAULT_LIMIT = 20;
export const SUBMISSION_MAX_LIMIT = 100;

export const SUBMISSION_STATUS_TRANSITIONS: Record<
  SubmissionStatusValue,
  readonly SubmissionStatusValue[]
> = {
  PENDING: ['SUBMITTED', 'LATE'],
  SUBMITTED: ['GRADED', 'RETURNED'],
  LATE: ['GRADED', 'RETURNED'],
  GRADED: ['RETURNED'],
  RETURNED: [],
};
