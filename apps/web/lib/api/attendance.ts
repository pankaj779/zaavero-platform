import { apiFetch } from '../auth/api-client';
import type { AttendanceSessionDto } from '../teacher/attendance-types';
import {
  mapAttendanceApiToTeacherSessionDto,
  mapAttendancesToSessionDtos,
  type AttendanceApiRecord,
  type AttendanceListMeta,
  type AttendanceListResult,
  type AttendanceLiveSessionLookup,
} from './attendance-mapper';
import { LiveSessionApi } from './live-session';

export interface ListAttendancesParams {
  organizationId?: string;
  liveSessionId?: string;
  studentId?: string;
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'markedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich session shells from Live Session / Batch / Course APIs. */
  enrichLookups?: boolean;
}

export interface CreateAttendanceInput {
  organizationId: string;
  liveSessionId: string;
  studentId: string;
  status?: string;
  markedAt?: string;
  notes?: string;
}

export interface UpdateAttendanceInput {
  status?: string;
  markedAt?: string | null;
  notes?: string | null;
}

interface PaginatedAttendancesApiPayload {
  items: AttendanceApiRecord[];
  meta: AttendanceListMeta;
}

function buildQuery(params: ListAttendancesParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.liveSessionId) {
    query.set('liveSessionId', params.liveSessionId);
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

function durationMinutes(startsAt: string, endsAt: string | null): number {
  if (!endsAt) {
    return 0;
  }
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }
  return Math.round((end - start) / 60_000);
}

async function buildLiveSessionLookups(
  organizationId: string | undefined,
  liveSessionId: string | undefined,
): Promise<ReadonlyMap<string, AttendanceLiveSessionLookup>> {
  try {
    if (liveSessionId) {
      const session = await LiveSessionApi.getLiveSession(liveSessionId);
      return new Map([
        [
          session.id,
          {
            id: session.id,
            title: session.title,
            status: session.status,
            startsAt: session.startsAt,
            endsAt: session.endsAt,
            updatedAt: session.updatedAt,
            batchId: session.batch.id,
            courseId: session.course.id,
            courseSlug: session.course.slug,
            courseTitle: session.course.title,
            batchName: session.batch.name,
            studentsEnrolled: session.batch.studentsEnrolled,
            durationMinutes: session.durationMinutes,
          },
        ],
      ]);
    }

    const result = await LiveSessionApi.getLiveSessions({
      organizationId,
      page: 1,
      limit: 100,
      sortBy: 'startsAt',
      sortOrder: 'desc',
      enrichLookups: true,
    });

    return new Map(
      result.items.map((session) => [
        session.id,
        {
          id: session.id,
          title: session.title,
          status: session.status,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
          updatedAt: session.updatedAt,
          batchId: session.batch.id,
          courseId: session.course.id,
          courseSlug: session.course.slug,
          courseTitle: session.course.title,
          batchName: session.batch.name,
          studentsEnrolled: session.batch.studentsEnrolled,
          durationMinutes:
            session.durationMinutes || durationMinutes(session.startsAt, session.endsAt),
        },
      ]),
    );
  } catch {
    return new Map();
  }
}

/**
 * Attendance API client — all NestJS attendance calls go through here.
 * Components must never call fetch directly.
 *
 * List responses are grouped into session-centric teacher DTOs so the existing
 * Attendance workspace can consume them without UI changes.
 */
export const AttendanceApi = {
  async getAttendances(params: ListAttendancesParams = {}): Promise<AttendanceListResult> {
    const { enrichLookups = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedAttendancesApiPayload>(
      `/attendances${buildQuery(listParams)}`,
    );

    const liveSessions = enrichLookups
      ? await buildLiveSessionLookups(listParams.organizationId, listParams.liveSessionId)
      : undefined;

    return {
      items: mapAttendancesToSessionDtos(payload.items, liveSessions),
      meta: payload.meta,
    };
  },

  async getAttendance(id: string): Promise<AttendanceSessionDto> {
    const record = await apiFetch<AttendanceApiRecord>(`/attendances/${id}`);
    const liveSessions = await buildLiveSessionLookups(record.organizationId, record.liveSessionId);
    return mapAttendanceApiToTeacherSessionDto(record, liveSessions);
  },

  async createAttendance(input: CreateAttendanceInput): Promise<AttendanceSessionDto> {
    const record = await apiFetch<AttendanceApiRecord>('/attendances', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const liveSessions = await buildLiveSessionLookups(record.organizationId, record.liveSessionId);
    return mapAttendanceApiToTeacherSessionDto(record, liveSessions);
  },

  async updateAttendance(id: string, input: UpdateAttendanceInput): Promise<AttendanceSessionDto> {
    const record = await apiFetch<AttendanceApiRecord>(`/attendances/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    const liveSessions = await buildLiveSessionLookups(record.organizationId, record.liveSessionId);
    return mapAttendanceApiToTeacherSessionDto(record, liveSessions);
  },
};
