import type { TeacherBatchStatus, TeacherBatchSummaryDto } from '../teacher/batch-types';

/** Raw batch payload from NestJS Batch API (frontend-owned mirror). */
export interface BatchApiRecord {
  id: string;
  organizationId: string;
  courseId: string;
  teacherId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  maxStudents: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BatchListResult {
  items: TeacherBatchSummaryDto[];
  meta: BatchListMeta;
}

/** Optional course lookup used to enrich list cards when courses are already loaded. */
export interface BatchCourseLookup {
  id: string;
  slug: string;
  title: string;
}

function mapStatus(status: string): TeacherBatchStatus {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'archived';
    case 'UPCOMING':
    default:
      return 'upcoming';
  }
}

/**
 * Maps NestJS batch records to teacher workspace DTOs.
 * Enrollment counts, progress, next live class, and mentor name are stubbed
 * until dedicated rollup endpoints exist.
 */
export function mapBatchApiToTeacherSummary(
  record: BatchApiRecord,
  courseLookup?: ReadonlyMap<string, BatchCourseLookup>,
): TeacherBatchSummaryDto {
  const status = mapStatus(record.status);
  const course = courseLookup?.get(record.courseId);

  return {
    id: record.id,
    name: record.name,
    course: {
      id: record.courseId,
      slug: course?.slug ?? '',
      title: course?.title ?? 'Course',
    },
    status,
    mentor: {
      id: record.teacherId,
      name: 'Teacher',
    },
    studentsEnrolled: 0,
    capacity: record.maxStudents ?? 0,
    startDate: record.startDate,
    endDate: record.endDate ?? '',
    nextLiveClass: null,
    progress: {
      completedLessons: 0,
      totalLessons: 0,
      percentage: 0,
    },
    updatedAt: record.updatedAt,
  };
}

export function mapBatchApiList(
  records: BatchApiRecord[],
  courseLookup?: ReadonlyMap<string, BatchCourseLookup>,
): TeacherBatchSummaryDto[] {
  return records.map((record) => mapBatchApiToTeacherSummary(record, courseLookup));
}
