export const BATCH_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'status', 'startDate'] as const;

export type BatchSortField = (typeof BATCH_SORT_FIELDS)[number];

export const BATCH_STATUSES = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type BatchStatusValue = (typeof BATCH_STATUSES)[number];

export const BATCH_DEFAULT_PAGE = 1;
export const BATCH_DEFAULT_LIMIT = 20;
export const BATCH_MAX_LIMIT = 100;
