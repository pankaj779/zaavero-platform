import type {
  TeacherSubmissionAttachmentDto,
  TeacherSubmissionStatus,
  TeacherSubmissionSummaryDto,
} from '../teacher/submission-types';

/** Raw submission payload from NestJS Submission API (frontend-owned mirror). */
export interface SubmissionApiRecord {
  id: string;
  organizationId: string;
  assignmentId: string;
  studentId: string;
  status: string;
  content: string | null;
  attachments: string[];
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  gradedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubmissionListResult {
  items: TeacherSubmissionSummaryDto[];
  meta: SubmissionListMeta;
}

export interface SubmissionAssignmentLookup {
  id: string;
  title: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  maxScore: number | null;
}

function mapStatus(status: string): TeacherSubmissionStatus {
  switch (status.toUpperCase()) {
    case 'SUBMITTED':
      return 'submitted';
    case 'GRADED':
      return 'graded';
    case 'RETURNED':
      return 'returned';
    case 'LATE':
      return 'late';
    case 'PENDING':
    default:
      return 'pending';
  }
}

function buildInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'ST';
  }
  const first = parts[0];
  if (!first) {
    return 'ST';
  }
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }
  const last = parts[parts.length - 1];
  if (!last) {
    return first.slice(0, 2).toUpperCase();
  }
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function mapAttachments(attachments: string[]): TeacherSubmissionAttachmentDto[] {
  if (attachments.length === 0) {
    return [];
  }

  return attachments.map((value, index) => {
    const label = value.trim().length > 0 ? value.trim() : `Attachment ${String(index + 1)}`;
    return {
      id: `attachment_${String(index + 1)}`,
      label,
      // TEMPORARY: MIME/kind is not provided by SubmissionResponseDto.
      kind: 'document',
    };
  });
}

/**
 * Maps NestJS submission records to teacher workspace DTOs.
 *
 * TEMPORARY PLACEHOLDERS (until related endpoints exist):
 * - student name / initials / avatar (API returns studentId only)
 * - assignment title / course (enriched via lookups when available)
 * - grader name (API returns gradedById only)
 * - attachment preview thumbnails (API returns opaque string references)
 * - inline grading history / rubric summary
 */
export function mapSubmissionApiToTeacherSummary(
  record: SubmissionApiRecord,
  lookups?: {
    assignments?: ReadonlyMap<string, SubmissionAssignmentLookup>;
  },
): TeacherSubmissionSummaryDto {
  const status = mapStatus(record.status);
  const assignment = lookups?.assignments?.get(record.assignmentId);

  // TEMPORARY: student identity is not on SubmissionResponseDto.
  const fullName = 'Student';

  return {
    id: record.id,
    assignment: {
      id: record.assignmentId,
      title: assignment?.title ?? 'Assignment',
      course: {
        id: assignment?.courseId ?? '',
        slug: assignment?.courseSlug ?? '',
        title: assignment?.courseTitle ?? 'Course',
      },
      maxScore: assignment?.maxScore ?? null,
    },
    student: {
      id: record.studentId,
      fullName,
      initials: buildInitials(fullName),
      avatarUrl: null,
    },
    status,
    content: record.content,
    attachments: mapAttachments(record.attachments),
    score: record.score,
    feedback: record.feedback,
    submittedAt: record.submittedAt,
    gradedAt: record.gradedAt,
    grader:
      record.gradedById === null
        ? null
        : {
            id: record.gradedById,
            // TEMPORARY: grader display name is not on SubmissionResponseDto.
            name: 'Teacher',
          },
    updatedAt: record.updatedAt,
  };
}

export function mapSubmissionApiList(
  records: SubmissionApiRecord[],
  lookups?: {
    assignments?: ReadonlyMap<string, SubmissionAssignmentLookup>;
  },
): TeacherSubmissionSummaryDto[] {
  return records.map((record) => mapSubmissionApiToTeacherSummary(record, lookups));
}
