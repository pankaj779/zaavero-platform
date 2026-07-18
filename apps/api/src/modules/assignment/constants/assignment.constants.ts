export const ASSIGNMENT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'dueAt',
  'title',
  'status',
] as const;

export type AssignmentSortField = (typeof ASSIGNMENT_SORT_FIELDS)[number];

export const ASSIGNMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'] as const;

export type AssignmentStatusValue = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_DEFAULT_PAGE = 1;
export const ASSIGNMENT_DEFAULT_LIMIT = 20;
export const ASSIGNMENT_MAX_LIMIT = 100;
