import type { TeacherLessonContentType, TeacherLessonSummaryDto } from '../teacher/lesson-types';

/** Raw lesson payload from NestJS Lesson API (frontend-owned mirror). */
export interface LessonApiRecord {
  id: string;
  organizationId: string;
  moduleId: string;
  title: string;
  description: string | null;
  contentType: string;
  contentUrl: string | null;
  durationSeconds: number | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LessonListResult {
  items: TeacherLessonSummaryDto[];
  meta: LessonListMeta;
}

export interface LessonCourseLookup {
  id: string;
  slug: string;
  title: string;
}

function mapContentType(contentType: string): TeacherLessonContentType {
  switch (contentType.toUpperCase()) {
    case 'PDF':
      return 'pdf';
    case 'READING':
      return 'reading';
    case 'EXERCISE':
      return 'exercise';
    case 'QUIZ':
      return 'quiz';
    case 'ASSIGNMENT':
      return 'assignment';
    case 'LIVE':
      return 'live';
    case 'AI_TUTOR':
      return 'ai_tutor';
    case 'VIDEO':
    default:
      return 'video';
  }
}

/**
 * Maps NestJS lesson records to teacher workspace DTOs.
 *
 * TEMPORARY PLACEHOLDERS (until related endpoints exist):
 * - course title/slug (API returns moduleId only; optional courseId filter lookup)
 * - module name
 * - thumbnailUrl, attachmentCount, completionCount
 */
export function mapLessonApiToTeacherSummary(
  record: LessonApiRecord,
  options?: {
    course?: LessonCourseLookup;
  },
): TeacherLessonSummaryDto {
  const course = options?.course;

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? '',
    contentType: mapContentType(record.contentType),
    contentUrl: record.contentUrl,
    durationSeconds: record.durationSeconds,
    displayOrder: record.displayOrder,
    course: {
      id: course?.id ?? '',
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    module: {
      id: record.moduleId,
      // TEMPORARY: module titles are not included on LessonResponseDto yet.
      name: 'Module',
    },
    // TEMPORARY placeholders — keep in mapper only.
    thumbnailUrl: null,
    attachmentCount: 0,
    completionCount: 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapLessonApiList(
  records: LessonApiRecord[],
  options?: {
    course?: LessonCourseLookup;
  },
): TeacherLessonSummaryDto[] {
  return records.map((record) => mapLessonApiToTeacherSummary(record, options));
}
