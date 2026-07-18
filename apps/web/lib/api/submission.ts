import { apiFetch } from '../auth/api-client';
import type { TeacherSubmissionSummaryDto } from '../teacher/submission-types';
import { AssignmentApi } from './assignment';
import {
  mapSubmissionApiList,
  mapSubmissionApiToTeacherSummary,
  type SubmissionApiRecord,
  type SubmissionAssignmentLookup,
  type SubmissionListMeta,
  type SubmissionListResult,
} from './submission-mapper';

export interface ListSubmissionsParams {
  organizationId?: string;
  assignmentId?: string;
  studentId?: string;
  status?: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RETURNED' | 'LATE';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'submittedAt' | 'status' | 'score';
  sortOrder?: 'asc' | 'desc';
  /** When true (default), enrich assignment/course titles from AssignmentApi. */
  enrichLookups?: boolean;
}

export interface CreateSubmissionInput {
  organizationId: string;
  assignmentId: string;
  studentId?: string;
  content?: string | null;
  attachments?: string[];
  status?: string;
}

export interface UpdateSubmissionInput {
  content?: string | null;
  attachments?: string[];
  status?: string;
  score?: number | null;
  feedback?: string | null;
}

interface PaginatedSubmissionsApiPayload {
  items: SubmissionApiRecord[];
  meta: SubmissionListMeta;
}

function buildQuery(params: ListSubmissionsParams = {}): string {
  const query = new URLSearchParams();

  if (params.organizationId) {
    query.set('organizationId', params.organizationId);
  }
  if (params.assignmentId) {
    query.set('assignmentId', params.assignmentId);
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

async function buildAssignmentLookups(
  organizationId: string | undefined,
): Promise<ReadonlyMap<string, SubmissionAssignmentLookup>> {
  try {
    const result = await AssignmentApi.getAssignments({
      organizationId,
      page: 1,
      limit: 100,
      sortBy: 'title',
      sortOrder: 'asc',
      enrichLookups: true,
    });

    return new Map(
      result.items.map((assignment) => [
        assignment.id,
        {
          id: assignment.id,
          title: assignment.title,
          courseId: assignment.course.id,
          courseSlug: assignment.course.slug,
          courseTitle: assignment.course.title,
          maxScore: assignment.grading.maxScore,
        },
      ]),
    );
  } catch {
    return new Map();
  }
}

/**
 * Submission API client — all NestJS submission calls go through here.
 * Components must never call fetch directly.
 */
export const SubmissionApi = {
  async getSubmissions(params: ListSubmissionsParams = {}): Promise<SubmissionListResult> {
    const { enrichLookups = true, ...listParams } = params;
    const payload = await apiFetch<PaginatedSubmissionsApiPayload>(
      `/submissions${buildQuery(listParams)}`,
    );

    const assignments = enrichLookups
      ? await buildAssignmentLookups(listParams.organizationId)
      : undefined;

    return {
      items: mapSubmissionApiList(payload.items, { assignments }),
      meta: payload.meta,
    };
  },

  async getSubmission(id: string): Promise<TeacherSubmissionSummaryDto> {
    const record = await apiFetch<SubmissionApiRecord>(`/submissions/${id}`);
    const assignments = await buildAssignmentLookups(record.organizationId);
    return mapSubmissionApiToTeacherSummary(record, { assignments });
  },

  async createSubmission(input: CreateSubmissionInput): Promise<TeacherSubmissionSummaryDto> {
    const record = await apiFetch<SubmissionApiRecord>('/submissions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapSubmissionApiToTeacherSummary(record);
  },

  async updateSubmission(
    id: string,
    input: UpdateSubmissionInput,
  ): Promise<TeacherSubmissionSummaryDto> {
    const record = await apiFetch<SubmissionApiRecord>(`/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return mapSubmissionApiToTeacherSummary(record);
  },
};
