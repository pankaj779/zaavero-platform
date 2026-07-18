import { apiFetch } from '../auth/api-client';
import type { TeacherAssignmentDto } from '../teacher/assignment-types';
import {
  mapAssignmentApiList,
  mapAssignmentApiToTeacherSummary,
  type AssignmentApiRecord,
  type AssignmentBatchLookup,
  type AssignmentCourseLookup,
  type AssignmentListMeta,
  type AssignmentListResult,
} from './assignment-mapper';
import { BatchApi } from './batch';
import { CourseApi } from './course';

export interface ListAssignmentsParams {
  organizationId?: string;
  courseId?: string;
  batchId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueAt' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich course/batch titles from related APIs. */
  enrichLookups?: boolean;
}

export interface CreateAssignmentInput {
  organizationId: string;
  courseId: string;
  batchId?: string | null;
  title: string;
  instructions?: string | null;
  status?: string;
  maxScore?: number | null;
  dueAt?: string | null;
  attachmentUrls?: string[];
}

export interface UpdateAssignmentInput {
  title?: string;
  instructions?: string | null;
  status?: string;
  maxScore?: number | null;
  dueAt?: string | null;
  batchId?: string | null;
  attachmentUrls?: string[];
}

interface PaginatedAssignmentsApiPayload {
  items: AssignmentApiRecord[];
  meta: AssignmentListMeta;
}

function buildQuery(params: ListAssignmentsParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.courseId) {
    query.set('courseId', params.courseId);
  }
  if (params.batchId) {
    query.set('batchId', params.batchId);
  }
  if (params.status) {
    query.set('status', params.status);
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

async function buildLookups(organizationId: string | undefined): Promise<{
  courses: ReadonlyMap<string, AssignmentCourseLookup>;
  batches: ReadonlyMap<string, AssignmentBatchLookup>;
}> {
  try {
    const [courses, batches] = await Promise.all([
      CourseApi.getCourses({
        organizationId,
        page: 1,
        limit: 100,
        sortBy: 'title',
        sortOrder: 'asc',
      }),
      BatchApi.getBatches({
        organizationId,
        page: 1,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
        enrichCourses: false,
      }),
    ]);

    return {
      courses: new Map(
        courses.items.map((course) => [
          course.id,
          { id: course.id, slug: course.slug, title: course.title },
        ]),
      ),
      batches: new Map(
        batches.items.map((batch) => [
          batch.id,
          {
            id: batch.id,
            name: batch.name,
            studentsEnrolled: batch.studentsEnrolled,
          },
        ]),
      ),
    };
  } catch {
    return { courses: new Map(), batches: new Map() };
  }
}

/**
 * Assignment API client — all NestJS assignment calls go through here.
 * Components must never call fetch directly.
 */
export const AssignmentApi = {
  async getAssignments(params: ListAssignmentsParams = {}): Promise<AssignmentListResult> {
    const { enrichLookups = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedAssignmentsApiPayload>(
      `/assignments${buildQuery(listParams)}`,
    );

    const lookups = enrichLookups ? await buildLookups(listParams.organizationId) : undefined;

    return {
      items: mapAssignmentApiList(payload.items, lookups),
      meta: payload.meta,
    };
  },

  async getAssignment(id: string): Promise<TeacherAssignmentDto> {
    const record = await apiFetch<AssignmentApiRecord>(`/assignments/${id}`);
    const lookups = await buildLookups(record.organizationId);
    return mapAssignmentApiToTeacherSummary(record, lookups);
  },

  async createAssignment(input: CreateAssignmentInput): Promise<TeacherAssignmentDto> {
    const record = await apiFetch<AssignmentApiRecord>('/assignments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapAssignmentApiToTeacherSummary(record);
  },

  async updateAssignment(id: string, input: UpdateAssignmentInput): Promise<TeacherAssignmentDto> {
    const record = await apiFetch<AssignmentApiRecord>(`/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapAssignmentApiToTeacherSummary(record);
  },

  async deleteAssignment(id: string): Promise<TeacherAssignmentDto> {
    const record = await apiFetch<AssignmentApiRecord>(`/assignments/${id}`, {
      method: 'DELETE',
    });
    return mapAssignmentApiToTeacherSummary(record);
  },
};
