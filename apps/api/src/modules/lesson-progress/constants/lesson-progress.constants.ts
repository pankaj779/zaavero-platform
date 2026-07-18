export const LESSON_PROGRESS_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type LessonProgressStatusValue = (typeof LESSON_PROGRESS_STATUSES)[number];
export const LESSON_PROGRESS_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'progressPercent',
  'status',
  'completedAt',
] as const;
export type LessonProgressSortField = (typeof LESSON_PROGRESS_SORT_FIELDS)[number];
export const LESSON_PROGRESS_DEFAULT_PAGE = 1;
export const LESSON_PROGRESS_DEFAULT_LIMIT = 20;
export const LESSON_PROGRESS_MAX_LIMIT = 100;
