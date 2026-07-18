import { apiFetch } from '../auth/api-client';
import type { TeacherCalendarEventDto } from '../teacher/calendar-types';
import { BatchApi } from './batch';
import {
  mapCalendarApiList,
  mapCalendarApiToTeacherEvent,
  type CalendarApiRecord,
  type CalendarBatchLookup,
  type CalendarCourseLookup,
  type CalendarListMeta,
  type CalendarListResult,
} from './calendar-mapper';
import { CourseApi } from './course';

export interface ListCalendarEventsParams {
  organizationId?: string;
  courseId?: string;
  batchId?: string;
  liveSessionId?: string;
  assignmentId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'startsAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich course/batch titles from related APIs. */
  enrichLookups?: boolean;
}

export interface CreateCalendarEventInput {
  organizationId: string;
  title: string;
  startsAt: string;
  courseId?: string | null;
  batchId?: string | null;
  liveSessionId?: string | null;
  assignmentId?: string | null;
  description?: string | null;
  endsAt?: string | null;
  allDay?: boolean;
  externalProvider?: string;
  externalEventId?: string | null;
}

export interface UpdateCalendarEventInput {
  title?: string;
  courseId?: string | null;
  batchId?: string | null;
  liveSessionId?: string | null;
  assignmentId?: string | null;
  description?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  allDay?: boolean;
  externalProvider?: string;
  externalEventId?: string | null;
}

interface PaginatedCalendarEventsApiPayload {
  items: CalendarApiRecord[];
  meta: CalendarListMeta;
}

function buildQuery(params: ListCalendarEventsParams = {}): string {
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
  if (params.liveSessionId) {
    query.set('liveSessionId', params.liveSessionId);
  }
  if (params.assignmentId) {
    query.set('assignmentId', params.assignmentId);
  }
  if (params.from) {
    query.set('from', params.from);
  }
  if (params.to) {
    query.set('to', params.to);
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
  courses: ReadonlyMap<string, CalendarCourseLookup>;
  batches: ReadonlyMap<string, CalendarBatchLookup>;
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
 * Calendar API client — all NestJS calendar-event calls go through here.
 * Components must never call fetch directly.
 */
export const CalendarApi = {
  async getCalendarEvents(params: ListCalendarEventsParams = {}): Promise<CalendarListResult> {
    const { enrichLookups = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedCalendarEventsApiPayload>(
      `/calendar-events${buildQuery(listParams)}`,
    );

    const lookups = enrichLookups ? await buildLookups(listParams.organizationId) : undefined;

    return {
      items: mapCalendarApiList(payload.items, lookups),
      meta: payload.meta,
    };
  },

  async getCalendarEvent(id: string): Promise<TeacherCalendarEventDto> {
    const record = await apiFetch<CalendarApiRecord>(`/calendar-events/${id}`);
    const lookups = await buildLookups(record.organizationId);
    return mapCalendarApiToTeacherEvent(record, lookups);
  },

  async createCalendarEvent(input: CreateCalendarEventInput): Promise<TeacherCalendarEventDto> {
    const record = await apiFetch<CalendarApiRecord>('/calendar-events', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapCalendarApiToTeacherEvent(record);
  },

  async updateCalendarEvent(
    id: string,
    input: UpdateCalendarEventInput,
  ): Promise<TeacherCalendarEventDto> {
    const record = await apiFetch<CalendarApiRecord>(`/calendar-events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapCalendarApiToTeacherEvent(record);
  },

  async deleteCalendarEvent(id: string): Promise<void> {
    await apiFetch<null>(`/calendar-events/${id}`, {
      method: 'DELETE',
    });
  },
};
