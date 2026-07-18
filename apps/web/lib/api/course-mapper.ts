import type { TeacherCourseStatus, TeacherCourseSummaryDto } from '../teacher/course-types';

/** Raw course payload from NestJS Course API (frontend-owned mirror). */
export interface CourseApiRecord {
  id: string;
  organizationId: string;
  teacherId: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: string;
  status: string;
  language: string;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseListResult {
  items: TeacherCourseSummaryDto[];
  meta: CourseListMeta;
}

function mapStatus(status: string): TeacherCourseStatus {
  switch (status.toUpperCase()) {
    case 'PUBLISHED':
      return 'published';
    case 'ARCHIVED':
      return 'archived';
    case 'DRAFT':
    default:
      return 'draft';
  }
}

/**
 * Maps NestJS course records to teacher workspace DTOs.
 * Counts/media are stubbed until dedicated rollup/media endpoints exist.
 */
export function mapCourseApiToTeacherSummary(record: CourseApiRecord): TeacherCourseSummaryDto {
  const status = mapStatus(record.status);

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description ?? '',
    status,
    isPublished: status === 'published',
    media: {
      thumbnailUrl: record.thumbnailUrl ?? null,
      thumbnailAlt: `${record.title} thumbnail`,
    },
    counts: {
      batches: 0,
      students: 0,
      lessons: 0,
      assignments: 0,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapCourseApiList(records: CourseApiRecord[]): TeacherCourseSummaryDto[] {
  return records.map(mapCourseApiToTeacherSummary);
}
