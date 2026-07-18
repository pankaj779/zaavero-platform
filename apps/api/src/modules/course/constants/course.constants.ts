export const COURSE_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'status',
  'difficulty',
] as const;

export type CourseSortField = (typeof COURSE_SORT_FIELDS)[number];

export const COURSE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type CourseStatusValue = (typeof COURSE_STATUSES)[number];

export const COURSE_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type CourseDifficultyValue = (typeof COURSE_DIFFICULTIES)[number];

export const COURSE_DEFAULT_PAGE = 1;
export const COURSE_DEFAULT_LIMIT = 20;
export const COURSE_MAX_LIMIT = 100;

export const COURSE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
