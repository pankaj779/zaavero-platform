import type {
  TeacherAssignmentDto,
  TeacherAssignmentStatus,
  TeacherAssignmentTimelineEventDto,
} from '../teacher/assignment-types';

/** Raw assignment payload from NestJS Assignment API (frontend-owned mirror). */
export interface AssignmentApiRecord {
  id: string;
  organizationId: string;
  courseId: string;
  batchId: string | null;
  title: string;
  instructions: string | null;
  status: string;
  maxScore: number | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AssignmentListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssignmentListResult {
  items: TeacherAssignmentDto[];
  meta: AssignmentListMeta;
}

export interface AssignmentCourseLookup {
  id: string;
  slug: string;
  title: string;
}

export interface AssignmentBatchLookup {
  id: string;
  name: string;
  studentsEnrolled: number;
}

function mapStatus(status: string): TeacherAssignmentStatus {
  switch (status.toUpperCase()) {
    case 'PUBLISHED':
      return 'published';
    case 'CLOSED':
      return 'closed';
    case 'ARCHIVED':
      return 'archived';
    case 'DRAFT':
    default:
      return 'draft';
  }
}

function buildTimeline(
  status: TeacherAssignmentStatus,
  createdAt: string,
  updatedAt: string,
): TeacherAssignmentTimelineEventDto[] {
  const events: TeacherAssignmentTimelineEventDto[] = [
    { id: 'created', label: 'Created', at: createdAt },
  ];

  if (status === 'published' || status === 'closed' || status === 'archived') {
    events.push({ id: 'published', label: 'Published', at: updatedAt });
  }
  if (status === 'closed') {
    events.push({ id: 'closed', label: 'Closed', at: updatedAt });
  }
  if (status === 'archived') {
    events.push({ id: 'archived', label: 'Archived', at: updatedAt });
  }

  return events;
}

/**
 * Maps NestJS assignment records to teacher workspace DTOs.
 *
 * TEMPORARY PLACEHOLDERS (until related endpoints exist):
 * - course title/slug (enriched via lookups when available)
 * - batch name / studentsEnrolled (enriched via lookups when available)
 * - submission counts / submission rate
 * - grading awaitingReview / averageScore
 * - attachment preview
 * - timeline beyond created/updated heuristics
 * - integration availability flags
 */
export function mapAssignmentApiToTeacherSummary(
  record: AssignmentApiRecord,
  lookups?: {
    courses?: ReadonlyMap<string, AssignmentCourseLookup>;
    batches?: ReadonlyMap<string, AssignmentBatchLookup>;
  },
): TeacherAssignmentDto {
  const status = mapStatus(record.status);
  const course = lookups?.courses?.get(record.courseId);
  const batch = record.batchId ? lookups?.batches?.get(record.batchId) : undefined;
  const maxScore = record.maxScore ?? 0;
  const studentsEnrolled = batch?.studentsEnrolled ?? 0;

  return {
    id: record.id,
    title: record.title,
    course: {
      id: record.courseId,
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    batches: record.batchId
      ? [
          {
            id: record.batchId,
            name: batch?.name ?? 'Batch',
            studentsEnrolled,
          },
        ]
      : [],
    status,
    dueAt: record.dueAt,
    // TEMPORARY: submission rollups are not on AssignmentResponseDto.
    submissions: {
      totalStudents: studentsEnrolled,
      submitted: 0,
      pending: studentsEnrolled,
      graded: 0,
      submissionRate: status === 'draft' ? null : studentsEnrolled > 0 ? 0 : null,
    },
    // TEMPORARY: grading rollups beyond maxScore are not on AssignmentResponseDto.
    grading: {
      graded: 0,
      awaitingReview: 0,
      averageScore: null,
      maxScore,
    },
    // TEMPORARY: attachment metadata is not on AssignmentResponseDto.
    attachments: [
      {
        id: 'attachment_placeholder',
        label: 'Submission attachment placeholder',
        kind: 'document',
      },
    ],
    // TEMPORARY: full status-transition history is not on AssignmentResponseDto.
    timeline: buildTimeline(status, record.createdAt, record.updatedAt),
    integrations: {
      plagiarismDetection: 'coming_soon',
      aiEvaluation: 'coming_soon',
      rubricGrading: 'coming_soon',
      notifications: 'coming_soon',
    },
    updatedAt: record.updatedAt,
  };
}

export function mapAssignmentApiList(
  records: AssignmentApiRecord[],
  lookups?: {
    courses?: ReadonlyMap<string, AssignmentCourseLookup>;
    batches?: ReadonlyMap<string, AssignmentBatchLookup>;
  },
): TeacherAssignmentDto[] {
  return records.map((record) => mapAssignmentApiToTeacherSummary(record, lookups));
}
