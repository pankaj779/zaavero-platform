export const LESSON_CONTENT_TYPES = [
  'VIDEO',
  'PDF',
  'READING',
  'EXERCISE',
  'QUIZ',
  'ASSIGNMENT',
  'LIVE',
  'AI_TUTOR',
] as const;

export type LessonContentTypeValue = (typeof LESSON_CONTENT_TYPES)[number];

export const LESSON_SORT_FIELDS = ['createdAt', 'updatedAt', 'displayOrder', 'title'] as const;

export type LessonSortField = (typeof LESSON_SORT_FIELDS)[number];

export const LESSON_DEFAULT_PAGE = 1;
export const LESSON_DEFAULT_LIMIT = 20;
export const LESSON_MAX_LIMIT = 100;
