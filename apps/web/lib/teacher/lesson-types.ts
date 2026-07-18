import { formatDashboardDate } from '../dashboard/format-date';

/**
 * Teacher Lessons view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type TeacherLessonContentType =
  'video' | 'pdf' | 'reading' | 'exercise' | 'quiz' | 'assignment' | 'live' | 'ai_tutor';

export type TeacherLessonsViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherLessonContentTypeFilter = 'all' | TeacherLessonContentType;
export type TeacherLessonSortOption = 'display_order' | 'alphabetical' | 'recently_updated';
export type TeacherLessonsViewMode = 'grid' | 'list';

export interface TeacherLessonCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface TeacherLessonModuleRefDto {
  id: string;
  name: string;
}

/** List/detail DTO for the teacher lessons workspace. */
export interface TeacherLessonSummaryDto {
  id: string;
  title: string;
  description: string;
  contentType: TeacherLessonContentType;
  contentUrl: string | null;
  durationSeconds: number | null;
  displayOrder: number;
  course: TeacherLessonCourseRefDto;
  module: TeacherLessonModuleRefDto;
  /** TEMPORARY until media endpoints exist. */
  thumbnailUrl: string | null;
  /** TEMPORARY until attachment rollups exist. */
  attachmentCount: number;
  /** TEMPORARY until completion rollups exist. */
  completionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherLessonStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export const teacherLessonsPageCopy = {
  title: 'Lessons',
  description: 'Author and organize lesson content across your courses.',
  searchPlaceholder: 'Search lessons by title',
  searchLabel: 'Search lessons',
  contentTypeFilterLabel: 'Filter by content type',
  courseFilterLabel: 'Filter by course',
  sortLabel: 'Sort lessons',
  viewModeLabel: 'Lesson view mode',
  gridViewLabel: 'Grid view',
  listViewLabel: 'List view',
  gridLabel: 'Your lessons',
  emptyTitle: 'No lessons yet',
  emptyDescription:
    'Lessons you create for your courses will appear here. Authoring tools expand in a later sprint.',
  noMatchesTitle: 'No matching lessons',
  noMatchesDescription: 'Try a different title, content type, or course filter.',
  errorTitle: 'Unable to load your lessons',
  errorDescription: 'Something went wrong while loading Lessons. Please try again.',
  viewButton: 'View',
  editButton: 'Edit',
  detailsButton: 'View details',
  comingSoonNote: 'Lesson actions activate in a later sprint.',
  courseLabel: 'Course',
  moduleLabel: 'Module',
  contentTypeLabel: 'Content type',
  durationLabel: 'Duration',
  orderLabel: 'Order',
  attachmentsLabel: 'Attachments',
  completionsLabel: 'Completions',
  lastUpdatedLabel: 'Last updated',
  noDurationLabel: 'Duration not set',
  detailsPanelLabel: 'Lesson details',
  detailsCloseLabel: 'Close lesson details',
  lessonInfoLabel: 'Lesson information',
  allCoursesLabel: 'All Courses',
} as const;

export const teacherLessonContentTypeLabel: Record<TeacherLessonContentType, string> = {
  video: 'Video',
  pdf: 'PDF',
  reading: 'Reading',
  exercise: 'Exercise',
  quiz: 'Quiz',
  assignment: 'Assignment',
  live: 'Live',
  ai_tutor: 'AI Tutor',
};

export const teacherLessonContentTypeFilterOptions: {
  value: TeacherLessonContentTypeFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Types' },
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'reading', label: 'Reading' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'live', label: 'Live' },
  { value: 'ai_tutor', label: 'AI Tutor' },
];

export const teacherLessonSortOptions: { value: TeacherLessonSortOption; label: string }[] = [
  { value: 'display_order', label: 'Display Order' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'recently_updated', label: 'Recently Updated' },
];

export function getTeacherLessonStats(lessons: TeacherLessonSummaryDto[]): TeacherLessonStatDto[] {
  const total = lessons.length;
  const videos = lessons.filter((lesson) => lesson.contentType === 'video').length;
  const quizzes = lessons.filter((lesson) => lesson.contentType === 'quiz').length;
  const readings = lessons.filter(
    (lesson) => lesson.contentType === 'reading' || lesson.contentType === 'pdf',
  ).length;

  return [
    {
      id: 'total-lessons',
      label: 'Total Lessons',
      value: String(total),
      helper: 'Lessons across your courses.',
    },
    {
      id: 'video-lessons',
      label: 'Video Lessons',
      value: String(videos),
      helper: 'Lessons delivered as video.',
    },
    {
      id: 'quiz-lessons',
      label: 'Quiz Lessons',
      value: String(quizzes),
      helper: 'Assessment-style lessons.',
    },
    {
      id: 'reading-lessons',
      label: 'Reading / PDF',
      value: String(readings),
      helper: 'Text and document lessons.',
    },
  ];
}

export function formatTeacherLessonDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

export function formatTeacherLessonDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) {
    return teacherLessonsPageCopy.noDurationLabel;
  }
  if (seconds < 60) {
    return `${String(seconds)}s`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${String(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${String(hours)}h` : `${String(hours)}h ${String(remainder)}m`;
}

export function getTeacherLessonById(
  lessons: TeacherLessonSummaryDto[],
  id: string,
): TeacherLessonSummaryDto | null {
  return lessons.find((lesson) => lesson.id === id) ?? null;
}

/** Maps UI sort option → NestJS list query params. */
export function toLessonListSort(sort: TeacherLessonSortOption): {
  sortBy: 'displayOrder' | 'title' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'alphabetical':
      return { sortBy: 'title', sortOrder: 'asc' };
    case 'recently_updated':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'display_order':
    default:
      return { sortBy: 'displayOrder', sortOrder: 'asc' };
  }
}

/** Maps UI content-type filter → NestJS enum (undefined = all). */
export function toLessonApiContentType(
  contentType: TeacherLessonContentTypeFilter,
):
  | 'VIDEO'
  | 'PDF'
  | 'READING'
  | 'EXERCISE'
  | 'QUIZ'
  | 'ASSIGNMENT'
  | 'LIVE'
  | 'AI_TUTOR'
  | undefined {
  switch (contentType) {
    case 'video':
      return 'VIDEO';
    case 'pdf':
      return 'PDF';
    case 'reading':
      return 'READING';
    case 'exercise':
      return 'EXERCISE';
    case 'quiz':
      return 'QUIZ';
    case 'assignment':
      return 'ASSIGNMENT';
    case 'live':
      return 'LIVE';
    case 'ai_tutor':
      return 'AI_TUTOR';
    case 'all':
    default:
      return undefined;
  }
}
