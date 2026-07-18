import type { TeacherLessonContentType } from '../teacher/lesson-types';
import type { StudentLessonProgressStatus } from './progress-types';

/**
 * Student course / enrollment view-model types.
 * Progress metrics are derived only from fetched lesson + progress records.
 */

export type StudentEnrollmentStatus = 'active' | 'completed' | 'inactive';
export type StudentCourseLearningStatus = 'not_started' | 'in_progress' | 'completed';

export interface StudentCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface StudentBatchRefDto {
  id: string;
  name: string;
}

export interface StudentCourseProgressDto {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  /** First incomplete lesson by display order, or null when all complete / no lessons. */
  resumeLessonId: string | null;
}

export interface StudentCourseCardDto {
  enrollmentId: string;
  course: StudentCourseRefDto;
  batch: StudentBatchRefDto;
  description: string;
  enrollmentStatus: StudentEnrollmentStatus;
  learningStatus: StudentCourseLearningStatus;
  progress: StudentCourseProgressDto;
  enrolledAt: string;
  completedAt: string | null;
  lastProgressAt: string | null;
  updatedAt: string;
}

export interface StudentCourseLessonDto {
  id: string;
  title: string;
  description: string;
  contentType: TeacherLessonContentType;
  contentUrl: string | null;
  durationSeconds: number | null;
  displayOrder: number;
  moduleId: string;
  progressStatus: StudentLessonProgressStatus;
  progressPercent: number;
  completedAt: string | null;
}

export interface StudentCourseModuleDto {
  id: string;
  /** Placeholder until module titles are returned by the Lesson API. */
  title: string;
  displayOrder: number;
  lessons: StudentCourseLessonDto[];
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
}

export type StudentIntegrationAvailability = 'available' | 'disabled' | 'coming_soon';

export interface StudentCourseCapabilitiesDto {
  mediaThumbnails: StudentIntegrationAvailability;
  moduleTitles: StudentIntegrationAvailability;
  teacherProfile: StudentIntegrationAvailability;
}

export interface StudentCourseDetailDto extends StudentCourseCardDto {
  modules: StudentCourseModuleDto[];
  capabilities: StudentCourseCapabilitiesDto;
}

export interface StudentCourseListResult {
  items: StudentCourseCardDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
