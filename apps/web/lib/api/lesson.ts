import { apiFetch } from '../auth/api-client';
import type { TeacherLessonSummaryDto } from '../teacher/lesson-types';
import { CourseApi } from './course';
import {
  mapLessonApiList,
  mapLessonApiToTeacherSummary,
  type LessonApiRecord,
  type LessonCourseLookup,
  type LessonListMeta,
  type LessonListResult,
} from './lesson-mapper';

export interface ListLessonsParams {
  organizationId?: string;
  moduleId?: string;
  courseId?: string;
  contentType?:
    'VIDEO' | 'PDF' | 'READING' | 'EXERCISE' | 'QUIZ' | 'ASSIGNMENT' | 'LIVE' | 'AI_TUTOR';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'displayOrder' | 'title';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich course title when courseId is provided. */
  enrichCourse?: boolean;
}

export interface CreateLessonInput {
  organizationId: string;
  moduleId: string;
  title: string;
  description?: string;
  contentType?: string;
  contentUrl?: string;
  durationSeconds?: number;
  displayOrder?: number;
}

export interface UpdateLessonInput {
  title?: string;
  description?: string | null;
  contentType?: string;
  contentUrl?: string | null;
  durationSeconds?: number | null;
  displayOrder?: number;
}

interface PaginatedLessonsApiPayload {
  items: LessonApiRecord[];
  meta: LessonListMeta;
}

function buildQuery(params: ListLessonsParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.moduleId) {
    query.set('moduleId', params.moduleId);
  }
  if (params.courseId) {
    query.set('courseId', params.courseId);
  }
  if (params.contentType) {
    query.set('contentType', params.contentType);
  }
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }

  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

async function resolveCourseLookup(
  courseId: string | undefined,
): Promise<LessonCourseLookup | undefined> {
  if (!courseId) {
    return undefined;
  }
  try {
    const course = await CourseApi.getCourse(courseId);
    return { id: course.id, slug: course.slug, title: course.title };
  } catch {
    return undefined;
  }
}

/**
 * Lesson API client — all NestJS lesson calls go through here.
 * Components must never call fetch directly.
 */
export const LessonApi = {
  async getLessons(params: ListLessonsParams = {}): Promise<LessonListResult> {
    const { enrichCourse = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedLessonsApiPayload>(`/lessons${buildQuery(listParams)}`);

    const course =
      enrichCourse && listParams.courseId
        ? await resolveCourseLookup(listParams.courseId)
        : undefined;

    return {
      items: mapLessonApiList(payload.items, { course }),
      meta: payload.meta,
    };
  },

  async getLesson(id: string): Promise<TeacherLessonSummaryDto> {
    const record = await apiFetch<LessonApiRecord>(`/lessons/${id}`);
    return mapLessonApiToTeacherSummary(record);
  },

  async createLesson(input: CreateLessonInput): Promise<TeacherLessonSummaryDto> {
    const record = await apiFetch<LessonApiRecord>('/lessons', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapLessonApiToTeacherSummary(record);
  },

  async updateLesson(id: string, input: UpdateLessonInput): Promise<TeacherLessonSummaryDto> {
    const record = await apiFetch<LessonApiRecord>(`/lessons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapLessonApiToTeacherSummary(record);
  },

  async deleteLesson(id: string): Promise<TeacherLessonSummaryDto> {
    const record = await apiFetch<LessonApiRecord>(`/lessons/${id}`, {
      method: 'DELETE',
    });
    return mapLessonApiToTeacherSummary(record);
  },
};
