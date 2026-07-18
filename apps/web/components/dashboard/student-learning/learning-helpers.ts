import type {
  StudentCourseDetailDto,
  StudentCourseLessonDto,
  StudentCourseModuleDto,
  StudentEnrollmentStatus,
  StudentLessonPlayerDto,
  StudentProgressOverviewDto,
} from '../../../lib/student';
import { formatDashboardDate } from '../../../lib/dashboard/format-date';

export type StudentCoursesViewState = 'loading' | 'empty' | 'error' | 'populated';
export type StudentEnrollmentStatusFilter =
  'all' | 'active' | 'completed' | 'dropped' | 'suspended';
export type StudentCourseSortOption = 'recent' | 'updated' | 'status';

export interface StudentProgressMilestone {
  id: string;
  threshold: number;
  title: string;
  description: string;
  unlocked: boolean;
}

export const studentEnrollmentStatusFilterOptions: {
  value: StudentEnrollmentStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'suspended', label: 'Suspended' },
];

export const studentCourseSortOptions: {
  value: StudentCourseSortOption;
  label: string;
}[] = [
  { value: 'recent', label: 'Recently enrolled' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'status', label: 'Status' },
];

const MILESTONE_DEFS: Omit<StudentProgressMilestone, 'unlocked'>[] = [
  {
    id: 'milestone-25',
    threshold: 25,
    title: 'Getting started',
    description: 'Reach 25% overall lesson completion.',
  },
  {
    id: 'milestone-50',
    threshold: 50,
    title: 'Halfway there',
    description: 'Reach 50% overall lesson completion.',
  },
  {
    id: 'milestone-75',
    threshold: 75,
    title: 'Almost there',
    description: 'Reach 75% overall lesson completion.',
  },
  {
    id: 'milestone-100',
    threshold: 100,
    title: 'Fully complete',
    description: 'Reach 100% overall lesson completion.',
  },
];

/** Maps UI enrollment filter to NestJS EnrollmentStatus query value. */
export function toEnrollmentApiStatus(
  status: StudentEnrollmentStatusFilter,
): 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED' | undefined {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'completed':
      return 'COMPLETED';
    case 'dropped':
      return 'DROPPED';
    case 'suspended':
      return 'SUSPENDED';
    case 'all':
    default:
      return undefined;
  }
}

/** Maps UI sort to enrollment list query params. */
export function toEnrollmentListSort(sort: StudentCourseSortOption): {
  sortBy: 'enrolledAt' | 'updatedAt' | 'status';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'updated':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'status':
      return { sortBy: 'status', sortOrder: 'asc' };
    case 'recent':
    default:
      return { sortBy: 'enrolledAt', sortOrder: 'desc' };
  }
}

export function formatStudentLearningDate(iso: string | null | undefined): string {
  return formatDashboardDate(iso, '—');
}

export function formatDurationSeconds(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined || seconds <= 0) {
    return null;
  }
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${String(mins)} min`;
  }
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${String(hours)}h` : `${String(hours)}h ${String(rem)}m`;
}

export function flattenCourseLessons(modules: StudentCourseModuleDto[]): StudentCourseLessonDto[] {
  return modules.flatMap((module) => module.lessons);
}

/**
 * Prefer the most recently progressed in-progress lesson (by completedAt fallback /
 * curriculum order), then API resumeLessonId, then first incomplete lesson.
 */
export function resolveResumeLessonId(
  course: Pick<StudentCourseDetailDto, 'modules' | 'progress'>,
): string | null {
  const lessons = flattenCourseLessons(course.modules);
  if (lessons.length === 0) {
    return null;
  }

  const inProgress = lessons.filter((lesson) => lesson.progressStatus === 'in_progress');
  if (inProgress.length > 0) {
    const ranked = [...inProgress].sort((left, right) => {
      const leftTime = left.completedAt ? new Date(left.completedAt).getTime() : 0;
      const rightTime = right.completedAt ? new Date(right.completedAt).getTime() : 0;
      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }
      return right.progressPercent - left.progressPercent;
    });
    return ranked[0]?.id ?? null;
  }

  if (course.progress.resumeLessonId) {
    return course.progress.resumeLessonId;
  }

  const incomplete = lessons.find((lesson) => lesson.progressStatus !== 'completed');
  return incomplete?.id ?? lessons[0]?.id ?? null;
}

/** Apply optimistic completion to a player DTO; used for UI rollback on failure. */
export function applyOptimisticLessonComplete(
  player: StudentLessonPlayerDto,
): StudentLessonPlayerDto {
  const wasComplete = player.lesson.progressStatus === 'completed';
  const completedDelta = wasComplete ? 0 : 1;
  const completedLessons = Math.min(
    player.course.progress.totalLessons,
    player.course.progress.completedLessons + completedDelta,
  );
  const totalLessons = player.course.progress.totalLessons;
  const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  const curriculum = player.curriculum.map((module) => {
    const lessons = module.lessons.map((lesson) => {
      if (lesson.id !== player.lesson.id) {
        return lesson;
      }
      return {
        ...lesson,
        progressStatus: 'completed' as const,
        progressPercent: 100,
        completedAt: lesson.completedAt ?? new Date().toISOString(),
      };
    });
    const moduleCompleted = lessons.filter((item) => item.progressStatus === 'completed').length;
    return {
      ...module,
      lessons,
      progress: {
        completedLessons: moduleCompleted,
        totalLessons: lessons.length,
        percentage: lessons.length === 0 ? 0 : Math.round((moduleCompleted / lessons.length) * 100),
      },
    };
  });

  return {
    ...player,
    course: {
      ...player.course,
      progress: { completedLessons, totalLessons, percentage },
    },
    lesson: {
      ...player.lesson,
      progressStatus: 'completed',
      progressPercent: 100,
      completedAt: player.lesson.completedAt ?? new Date().toISOString(),
    },
    curriculum,
  };
}

/**
 * Milestones are derived only from overall completion thresholds — never fabricated
 * from a missing milestones API.
 */
export function deriveProgressMilestones(
  overview: Pick<StudentProgressOverviewDto, 'percentage'>,
): StudentProgressMilestone[] {
  const percentage = overview.percentage ?? 0;
  return MILESTONE_DEFS.map((milestone) => ({
    ...milestone,
    unlocked: percentage >= milestone.threshold,
  }));
}

export function enrollmentStatusBadgeVariant(
  status: StudentEnrollmentStatus,
): 'success' | 'secondary' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'active':
      return 'secondary';
    case 'inactive':
    default:
      return 'neutral';
  }
}
