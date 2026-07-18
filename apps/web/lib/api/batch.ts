import { apiFetch } from '../auth/api-client';
import type { TeacherBatchSummaryDto } from '../teacher/batch-types';
import {
  mapBatchApiList,
  mapBatchApiToTeacherSummary,
  type BatchApiRecord,
  type BatchCourseLookup,
  type BatchListMeta,
  type BatchListResult,
} from './batch-mapper';
import { CourseApi } from './course';

export interface ListBatchesParams {
  organizationId?: string;
  search?: string;
  status?: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  courseId?: string;
  teacherId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'status' | 'startDate';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich course titles from CourseApi. */
  enrichCourses?: boolean;
}

export interface CreateBatchInput {
  organizationId: string;
  courseId: string;
  name: string;
  startDate: string;
  endDate?: string;
  status?: string;
  maxStudents?: number;
  teacherId?: string;
}

export interface UpdateBatchInput {
  name?: string;
  startDate?: string;
  endDate?: string | null;
  status?: string;
  maxStudents?: number | null;
  teacherId?: string;
}

interface PaginatedBatchesApiPayload {
  items: BatchApiRecord[];
  meta: BatchListMeta;
}

function buildQuery(params: ListBatchesParams = {}): string {
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
  if (params.courseId) {
    query.set('courseId', params.courseId);
  }
  if (params.teacherId) {
    query.set('teacherId', params.teacherId);
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

async function buildCourseLookup(
  organizationId: string | undefined,
): Promise<ReadonlyMap<string, BatchCourseLookup>> {
  try {
    const courses = await CourseApi.getCourses({
      organizationId,
      page: 1,
      limit: 100,
      sortBy: 'title',
      sortOrder: 'asc',
    });
    return new Map(
      courses.items.map((course) => [
        course.id,
        { id: course.id, slug: course.slug, title: course.title },
      ]),
    );
  } catch {
    return new Map();
  }
}

/**
 * Batch API client — all NestJS batch calls go through here.
 * Components must never call fetch directly.
 */
export const BatchApi = {
  async getBatches(params: ListBatchesParams = {}): Promise<BatchListResult> {
    const { enrichCourses = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedBatchesApiPayload>(`/batches${buildQuery(listParams)}`);

    const courseLookup = enrichCourses
      ? await buildCourseLookup(listParams.organizationId)
      : undefined;

    return {
      items: mapBatchApiList(payload.items, courseLookup),
      meta: payload.meta,
    };
  },

  async getBatch(id: string): Promise<TeacherBatchSummaryDto> {
    const record = await apiFetch<BatchApiRecord>(`/batches/${id}`);
    const courseLookup = await buildCourseLookup(record.organizationId);
    return mapBatchApiToTeacherSummary(record, courseLookup);
  },

  async createBatch(input: CreateBatchInput): Promise<TeacherBatchSummaryDto> {
    const record = await apiFetch<BatchApiRecord>('/batches', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapBatchApiToTeacherSummary(record);
  },

  async updateBatch(id: string, input: UpdateBatchInput): Promise<TeacherBatchSummaryDto> {
    const record = await apiFetch<BatchApiRecord>(`/batches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapBatchApiToTeacherSummary(record);
  },

  async deleteBatch(id: string): Promise<TeacherBatchSummaryDto> {
    const record = await apiFetch<BatchApiRecord>(`/batches/${id}`, {
      method: 'DELETE',
    });
    return mapBatchApiToTeacherSummary(record);
  },
};
