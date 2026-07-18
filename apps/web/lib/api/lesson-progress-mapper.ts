import type {
  StudentLessonProgressDto,
  StudentLessonProgressStatus,
} from '../student/progress-types';

/** Raw lesson-progress payload from NestJS Lesson Progress API (frontend-owned mirror). */
export interface LessonProgressApiRecord {
  id: string;
  organizationId: string;
  lessonId: string;
  studentId: string;
  status: string;
  progressPercent: number;
  lastPositionSeconds: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgressListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LessonProgressListResult {
  items: StudentLessonProgressDto[];
  meta: LessonProgressListMeta;
}

export function mapLessonProgressStatus(status: string): StudentLessonProgressStatus {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'completed';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'NOT_STARTED':
    default:
      return 'not_started';
  }
}

export function mapLessonProgressApiToDto(
  record: LessonProgressApiRecord,
): StudentLessonProgressDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    lessonId: record.lessonId,
    studentId: record.studentId,
    status: mapLessonProgressStatus(record.status),
    progressPercent: record.progressPercent,
    lastPositionSeconds: record.lastPositionSeconds,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapLessonProgressApiList(
  records: LessonProgressApiRecord[],
): StudentLessonProgressDto[] {
  return records.map(mapLessonProgressApiToDto);
}
