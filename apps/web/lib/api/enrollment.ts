import { apiFetch } from '../auth/api-client';
import type { TeacherStudentSummaryDto } from '../teacher/student-types';
import { BatchApi } from './batch';
import { CourseApi } from './course';
import {
  mapEnrollmentApiList,
  mapEnrollmentApiToTeacherStudent,
  type EnrollmentApiRecord,
  type EnrollmentBatchLookup,
  type EnrollmentCourseLookup,
  type EnrollmentListMeta,
  type EnrollmentListResult,
} from './enrollment-mapper';

export interface ListEnrollmentsParams {
  organizationId?: string;
  batchId?: string;
  courseId?: string;
  studentId?: string;
  search?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'enrolledAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich course/batch titles from related APIs. */
  enrichLookups?: boolean;
}

export interface CreateEnrollmentInput {
  organizationId: string;
  courseId: string;
  batchId: string;
  studentId: string;
  status?: string;
}

export interface UpdateEnrollmentInput {
  status?: string;
  completedAt?: string | null;
}

interface PaginatedEnrollmentsApiPayload {
  items: EnrollmentApiRecord[];
  meta: EnrollmentListMeta;
}

function buildQuery(params: ListEnrollmentsParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.batchId) {
    query.set('batchId', params.batchId);
  }
  if (params.courseId) {
    query.set('courseId', params.courseId);
  }
  if (params.studentId) {
    query.set('studentId', params.studentId);
  }
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
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

async function buildLookups(organizationId: string | undefined): Promise<{
  courses: ReadonlyMap<string, EnrollmentCourseLookup>;
  batches: ReadonlyMap<string, EnrollmentBatchLookup>;
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
        batches.items.map((batch) => [batch.id, { id: batch.id, name: batch.name }]),
      ),
    };
  } catch {
    return { courses: new Map(), batches: new Map() };
  }
}

/**
 * Enrollment API client — all NestJS enrollment calls go through here.
 * Components must never call fetch directly.
 */
export const EnrollmentApi = {
  async getEnrollments(params: ListEnrollmentsParams = {}): Promise<EnrollmentListResult> {
    const { enrichLookups = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedEnrollmentsApiPayload>(
      `/enrollments${buildQuery(listParams)}`,
    );

    const lookups = enrichLookups ? await buildLookups(listParams.organizationId) : undefined;

    return {
      items: mapEnrollmentApiList(payload.items, lookups),
      meta: payload.meta,
    };
  },

  async getEnrollment(id: string): Promise<TeacherStudentSummaryDto> {
    const record = await apiFetch<EnrollmentApiRecord>(`/enrollments/${id}`);
    const lookups = await buildLookups(record.organizationId);
    return mapEnrollmentApiToTeacherStudent(record, lookups);
  },

  async createEnrollment(input: CreateEnrollmentInput): Promise<TeacherStudentSummaryDto> {
    const record = await apiFetch<EnrollmentApiRecord>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapEnrollmentApiToTeacherStudent(record);
  },

  async updateEnrollment(
    id: string,
    input: UpdateEnrollmentInput,
  ): Promise<TeacherStudentSummaryDto> {
    const record = await apiFetch<EnrollmentApiRecord>(`/enrollments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapEnrollmentApiToTeacherStudent(record);
  },

  async deleteEnrollment(id: string): Promise<TeacherStudentSummaryDto> {
    const record = await apiFetch<EnrollmentApiRecord>(`/enrollments/${id}`, {
      method: 'DELETE',
    });
    return mapEnrollmentApiToTeacherStudent(record);
  },
};
