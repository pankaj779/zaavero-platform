import type {
  TeacherStudentEnrollmentStatus,
  TeacherStudentSummaryDto,
} from '../teacher/student-types';

/** Raw enrollment payload from NestJS Enrollment API (frontend-owned mirror). */
export interface EnrollmentApiRecord {
  id: string;
  organizationId: string;
  courseId: string;
  batchId: string;
  studentId: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrollmentListResult {
  items: TeacherStudentSummaryDto[];
  meta: EnrollmentListMeta;
}

/** Optional course lookup used to enrich list cards when courses are already loaded. */
export interface EnrollmentCourseLookup {
  id: string;
  slug: string;
  title: string;
}

/** Optional batch lookup used to enrich list cards when batches are already loaded. */
export interface EnrollmentBatchLookup {
  id: string;
  name: string;
}

function mapStatus(status: string): TeacherStudentEnrollmentStatus {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'COMPLETED':
      return 'completed';
    case 'DROPPED':
    case 'SUSPENDED':
    default:
      return 'inactive';
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

/**
 * Maps NestJS enrollment records to teacher student workspace DTOs.
 *
 * TEMPORARY PLACEHOLDERS (until enrollment/student rollup endpoints exist):
 * - fullName / email / initials / avatarUrl (API returns studentId only)
 * - progress metrics (percentage, assignments, attendance)
 * - isAtRisk
 */
export function mapEnrollmentApiToTeacherStudent(
  record: EnrollmentApiRecord,
  lookups?: {
    courses?: ReadonlyMap<string, EnrollmentCourseLookup>;
    batches?: ReadonlyMap<string, EnrollmentBatchLookup>;
  },
): TeacherStudentSummaryDto {
  const enrollmentStatus = mapStatus(record.status);
  const course = lookups?.courses?.get(record.courseId);
  const batch = lookups?.batches?.get(record.batchId);

  // TEMPORARY: student identity is not included on EnrollmentResponseDto yet.
  const fullName = 'Student';
  const email = '';

  return {
    id: record.id,
    fullName,
    email,
    avatarUrl: null,
    initials: buildInitials(fullName),
    batch: {
      id: record.batchId,
      name: batch?.name ?? 'Batch',
    },
    course: {
      id: record.courseId,
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    enrollmentStatus,
    // TEMPORARY: at-risk signal not provided by Enrollment API.
    isAtRisk: false,
    // TEMPORARY: progress rollups not provided by Enrollment API.
    progress: {
      percentage: 0,
      assignmentsCompleted: 0,
      assignmentsTotal: 0,
      attendancePercent: 0,
    },
    joinedAt: record.enrolledAt,
    updatedAt: record.updatedAt,
  };
}

export function mapEnrollmentApiList(
  records: EnrollmentApiRecord[],
  lookups?: {
    courses?: ReadonlyMap<string, EnrollmentCourseLookup>;
    batches?: ReadonlyMap<string, EnrollmentBatchLookup>;
  },
): TeacherStudentSummaryDto[] {
  return records.map((record) => mapEnrollmentApiToTeacherStudent(record, lookups));
}
