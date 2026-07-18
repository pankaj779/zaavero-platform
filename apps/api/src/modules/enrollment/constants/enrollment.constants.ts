export const ENROLLMENT_SORT_FIELDS = ['createdAt', 'updatedAt', 'enrolledAt', 'status'] as const;

export type EnrollmentSortField = (typeof ENROLLMENT_SORT_FIELDS)[number];

export const ENROLLMENT_STATUSES = ['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED'] as const;

export type EnrollmentStatusValue = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_DEFAULT_PAGE = 1;
export const ENROLLMENT_DEFAULT_LIMIT = 20;
export const ENROLLMENT_MAX_LIMIT = 100;
