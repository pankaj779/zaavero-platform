import { apiFetch } from '../auth/api-client';
import type { StudentLessonProgressDto } from '../student/progress-types';
import {
  mapLessonProgressApiList,
  mapLessonProgressApiToDto,
  type LessonProgressApiRecord,
  type LessonProgressListMeta,
  type LessonProgressListResult,
} from './lesson-progress-mapper';

export interface ListLessonProgressParams {
  organizationId?: string;
  lessonId?: string;
  studentId?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'completedAt' | 'progressPercent' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/** Student writes must omit studentId — backend defaults to the caller's StudentProfile. */
export interface CreateLessonProgressInput {
  organizationId: string;
  lessonId: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercent?: number;
  lastPositionSeconds?: number;
}

export interface UpdateLessonProgressInput {
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercent?: number;
  lastPositionSeconds?: number | null;
}

export interface MarkLessonCompleteInput {
  organizationId: string;
  lessonId: string;
}

interface PaginatedLessonProgressApiPayload {
  items: LessonProgressApiRecord[];
  meta: LessonProgressListMeta;
}

function buildQuery(params: ListLessonProgressParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.lessonId) {
    query.set('lessonId', params.lessonId);
  }
  if (params.studentId) {
    query.set('studentId', params.studentId);
  }
  if (params.status) {
    query.set('status', params.status);
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
 * Lesson Progress API client — all NestJS lesson-progress calls go through here.
 * Components must never call fetch directly.
 */
export const LessonProgressApi = {
  async getLessonProgress(
    params: ListLessonProgressParams = {},
  ): Promise<LessonProgressListResult> {
    const payload = await apiFetch<PaginatedLessonProgressApiPayload>(
      `/lesson-progress${buildQuery(params)}`,
    );

    return {
      items: mapLessonProgressApiList(payload.items),
      meta: payload.meta,
    };
  },

  async getLessonProgressById(id: string): Promise<StudentLessonProgressDto> {
    const record = await apiFetch<LessonProgressApiRecord>(`/lesson-progress/${id}`);
    return mapLessonProgressApiToDto(record);
  },

  async createLessonProgress(input: CreateLessonProgressInput): Promise<StudentLessonProgressDto> {
    const record = await apiFetch<LessonProgressApiRecord>('/lesson-progress', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapLessonProgressApiToDto(record);
  },

  async updateLessonProgress(
    id: string,
    input: UpdateLessonProgressInput,
  ): Promise<StudentLessonProgressDto> {
    const record = await apiFetch<LessonProgressApiRecord>(`/lesson-progress/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapLessonProgressApiToDto(record);
  },

  /**
   * Upsert-like completion: list by lesson, then update existing or create.
   * Student writes omit studentId.
   */
  async markLessonComplete(input: MarkLessonCompleteInput): Promise<StudentLessonProgressDto> {
    const existing = await LessonProgressApi.getLessonProgress({
      organizationId: input.organizationId,
      lessonId: input.lessonId,
      page: 1,
      limit: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    const current = existing.items[0];
    if (current) {
      return LessonProgressApi.updateLessonProgress(current.id, {
        status: 'COMPLETED',
        progressPercent: 100,
      });
    }

    return LessonProgressApi.createLessonProgress({
      organizationId: input.organizationId,
      lessonId: input.lessonId,
      status: 'COMPLETED',
      progressPercent: 100,
    });
  },
};
