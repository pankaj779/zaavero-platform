/**
 * Student lesson-progress view-model types.
 * Components consume these shapes only — never raw NestJS API payloads.
 */

export type StudentLessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface StudentLessonProgressDto {
  id: string;
  organizationId: string;
  lessonId: string;
  studentId: string;
  status: StudentLessonProgressStatus;
  progressPercent: number;
  lastPositionSeconds: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProgressCourseRollupDto {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  remainingLessons: number;
}

export interface StudentProgressOverviewDto {
  completedLessons: number;
  totalLessons: number;
  percentage: number | null;
  remainingLessons: number;
  courses: StudentProgressCourseRollupDto[];
  /** Null until a dedicated milestones API exists. */
  milestones: null;
  certificatesUnlocked: number;
}
