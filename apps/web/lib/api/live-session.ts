import { apiFetch } from '../auth/api-client';
import type { TeacherLiveClassDto } from '../teacher/live-session-types';
import { BatchApi } from './batch';
import { CourseApi } from './course';
import {
  mapLiveSessionApiList,
  mapLiveSessionApiToTeacherDto,
  type LiveSessionApiRecord,
  type LiveSessionBatchLookup,
  type LiveSessionCourseLookup,
  type LiveSessionListMeta,
  type LiveSessionListResult,
} from './live-session-mapper';

export interface ListLiveSessionsParams {
  organizationId?: string;
  batchId?: string;
  status?: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  meetingProvider?: 'NONE' | 'ZOOM' | 'GOOGLE_MEET' | 'CUSTOM' | 'SANDBOX';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'startsAt' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich course/batch titles from related APIs. */
  enrichLookups?: boolean;
}

export interface CreateLiveSessionInput {
  organizationId: string;
  batchId: string;
  title: string;
  description?: string;
  status?: string;
  meetingProvider?: string;
  meetingUrl?: string;
  recordingUrl?: string;
  startsAt: string;
  endsAt?: string;
}

export interface UpdateLiveSessionInput {
  title?: string;
  description?: string | null;
  status?: string;
  meetingProvider?: string;
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  startsAt?: string;
  endsAt?: string | null;
}

interface PaginatedLiveSessionsApiPayload {
  items: LiveSessionApiRecord[];
  meta: LiveSessionListMeta;
}

function buildQuery(params: ListLiveSessionsParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.batchId) {
    query.set('batchId', params.batchId);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.meetingProvider) {
    query.set('meetingProvider', params.meetingProvider);
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
  batches: ReadonlyMap<string, LiveSessionBatchLookup>;
  courses: ReadonlyMap<string, LiveSessionCourseLookup>;
}> {
  try {
    const [batches, courses] = await Promise.all([
      BatchApi.getBatches({
        organizationId,
        page: 1,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
        enrichCourses: true,
      }),
      CourseApi.getCourses({
        organizationId,
        page: 1,
        limit: 100,
        sortBy: 'title',
        sortOrder: 'asc',
      }),
    ]);

    return {
      batches: new Map(
        batches.items.map((batch) => [
          batch.id,
          {
            id: batch.id,
            name: batch.name,
            courseId: batch.course.id,
            studentsEnrolled: batch.studentsEnrolled,
          },
        ]),
      ),
      courses: new Map(
        courses.items.map((course) => [
          course.id,
          { id: course.id, slug: course.slug, title: course.title },
        ]),
      ),
    };
  } catch {
    return { batches: new Map(), courses: new Map() };
  }
}

/**
 * Live Session API client — all NestJS live-session calls go through here.
 * Components must never call fetch directly.
 */
export const LiveSessionApi = {
  async getLiveSessions(params: ListLiveSessionsParams = {}): Promise<LiveSessionListResult> {
    const { enrichLookups = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedLiveSessionsApiPayload>(
      `/live-sessions${buildQuery(listParams)}`,
    );

    const lookups = enrichLookups ? await buildLookups(listParams.organizationId) : undefined;

    return {
      items: mapLiveSessionApiList(payload.items, lookups),
      meta: payload.meta,
    };
  },

  async getLiveSession(id: string): Promise<TeacherLiveClassDto> {
    const record = await apiFetch<LiveSessionApiRecord>(`/live-sessions/${id}`);
    const lookups = await buildLookups(record.organizationId);
    return mapLiveSessionApiToTeacherDto(record, lookups);
  },

  async createLiveSession(input: CreateLiveSessionInput): Promise<TeacherLiveClassDto> {
    const record = await apiFetch<LiveSessionApiRecord>('/live-sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapLiveSessionApiToTeacherDto(record);
  },

  async updateLiveSession(id: string, input: UpdateLiveSessionInput): Promise<TeacherLiveClassDto> {
    const record = await apiFetch<LiveSessionApiRecord>(`/live-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapLiveSessionApiToTeacherDto(record);
  },

  async deleteLiveSession(id: string): Promise<TeacherLiveClassDto> {
    const record = await apiFetch<LiveSessionApiRecord>(`/live-sessions/${id}`, {
      method: 'DELETE',
    });
    return mapLiveSessionApiToTeacherDto(record);
  },

  async startLiveSession(id: string): Promise<TeacherLiveClassDto> {
    const record = await apiFetch<LiveSessionApiRecord>(`/live-sessions/${id}/start`, {
      method: 'POST',
    });
    return mapLiveSessionApiToTeacherDto(record);
  },

  async endLiveSession(id: string): Promise<TeacherLiveClassDto> {
    const record = await apiFetch<LiveSessionApiRecord>(`/live-sessions/${id}/end`, {
      method: 'POST',
    });
    return mapLiveSessionApiToTeacherDto(record);
  },

  async cancelLiveSession(id: string): Promise<TeacherLiveClassDto> {
    const record = await apiFetch<LiveSessionApiRecord>(`/live-sessions/${id}/cancel`, {
      method: 'POST',
    });
    return mapLiveSessionApiToTeacherDto(record);
  },
};
