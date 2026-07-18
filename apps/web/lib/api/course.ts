import { apiFetch } from '../auth/api-client';
import type { TeacherCourseSummaryDto } from '../teacher/course-types';
import {
  mapCourseApiList,
  mapCourseApiToTeacherSummary,
  type CourseApiRecord,
  type CourseListMeta,
  type CourseListResult,
} from './course-mapper';

export interface ListCoursesParams {
  organizationId?: string;
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  difficulty?: string;
  language?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'difficulty';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCourseInput {
  organizationId: string;
  title: string;
  slug: string;
  description?: string;
  difficulty?: string;
  status?: string;
  language?: string;
  teacherId?: string;
}

export interface UpdateCourseInput {
  title?: string;
  slug?: string;
  description?: string | null;
  difficulty?: string;
  status?: string;
  language?: string;
  teacherId?: string;
}

interface PaginatedCoursesApiPayload {
  items: CourseApiRecord[];
  meta: CourseListMeta;
}

function buildQuery(params: ListCoursesParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.difficulty) {
    query.set('difficulty', params.difficulty);
  }
  if (params.language) {
    query.set('language', params.language);
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

/**
 * Course API client — all NestJS course calls go through here.
 * Components must never call fetch directly.
 */
export const CourseApi = {
  async getCourses(params: ListCoursesParams = {}): Promise<CourseListResult> {
    const payload = await apiFetch<PaginatedCoursesApiPayload>(`/courses${buildQuery(params)}`);

    return {
      items: mapCourseApiList(payload.items),
      meta: payload.meta,
    };
  },

  async getCourse(id: string): Promise<TeacherCourseSummaryDto> {
    const record = await apiFetch<CourseApiRecord>(`/courses/${id}`);
    return mapCourseApiToTeacherSummary(record);
  },

  async createCourse(input: CreateCourseInput): Promise<TeacherCourseSummaryDto> {
    const record = await apiFetch<CourseApiRecord>('/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapCourseApiToTeacherSummary(record);
  },

  async updateCourse(id: string, input: UpdateCourseInput): Promise<TeacherCourseSummaryDto> {
    const record = await apiFetch<CourseApiRecord>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapCourseApiToTeacherSummary(record);
  },

  async deleteCourse(id: string): Promise<TeacherCourseSummaryDto> {
    const record = await apiFetch<CourseApiRecord>(`/courses/${id}`, {
      method: 'DELETE',
    });
    return mapCourseApiToTeacherSummary(record);
  },
};
