/**
 * My Learning list DTOs — shaped like future enrollment API responses.
 */

export type CourseStatus = 'not_started' | 'in_progress' | 'completed';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'all_levels';
export type LearningViewState = 'loading' | 'empty' | 'error' | 'populated';
export type CourseStatusFilter = 'all' | CourseStatus;
export type CourseSortOption = 'recent' | 'alphabetical' | 'progress';

/** Nested progress object matching future backend enrollment DTO */
export interface CourseProgressDto {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  estimatedTimeRemaining: string | null;
}

export interface InstructorSummaryDto {
  id: string;
  name: string;
}

export interface CourseMediaDto {
  thumbnailUrl: string | null;
  thumbnailAlt: string;
}

/** List-item DTO for enrolled courses (My Learning grid) */
export interface EnrolledCourseDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: CourseStatus;
  difficulty: CourseDifficulty;
  instructor: InstructorSummaryDto;
  media: CourseMediaDto;
  progress: CourseProgressDto;
  lastAccessedAt: string | null;
}

export interface LearningStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export interface ContinueLearningDto {
  course: {
    id: string;
    slug: string;
    title: string;
  };
  nextLesson: {
    id: string;
    title: string;
  };
  progress: {
    percentage: number;
  };
}

export interface RecentlyAccessedDto {
  course: {
    id: string;
    slug: string;
    title: string;
  };
  accessedAt: string;
}

/** Controls which My Learning UI state is shown in this sprint. */
export const learningViewState: LearningViewState = 'populated';

export const learningPageCopy = {
  title: 'My Learning',
  description: 'Programs you are enrolled in — continue where you left off.',
  searchPlaceholder: 'Search your courses',
  searchLabel: 'Search enrolled courses',
  statusFilterLabel: 'Filter by status',
  sortLabel: 'Sort courses',
  emptyTitle: 'No enrolled courses yet',
  emptyDescription:
    'When you enroll in a program, it will appear here so you can track progress and continue learning.',
  emptyCtaLabel: 'Browse Programs',
  errorTitle: 'Unable to load your courses',
  errorDescription: 'Something went wrong while loading My Learning. Please try again.',
  errorRetryLabel: 'Retry',
  continueLearningTitle: 'Continue Learning',
  recentlyAccessedTitle: 'Recently Accessed',
  noContinueTitle: 'Nothing to continue',
  noContinueDescription: 'Start a course to see your next lesson here.',
  noRecentTitle: 'No recent activity',
  noRecentDescription: 'Courses you open will appear in this list.',
  gridLabel: 'Enrolled courses',
  continueButton: 'Continue Learning',
  detailsButton: 'View Details',
  lessonsLabel: 'Lessons',
  remainingLabel: 'Time remaining',
  lastAccessedLabel: 'Last accessed',
  instructorLabel: 'Instructor',
  notAccessedYet: 'Not accessed yet',
  accessedPlaceholder: 'Last accessed placeholder',
} as const;

export const statusFilterOptions: { value: CourseStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'not_started', label: 'Not Started' },
];

export const sortOptions: { value: CourseSortOption; label: string }[] = [
  { value: 'recent', label: 'Recently Accessed' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'progress', label: 'Progress' },
];

export const statusBadgeLabel: Record<CourseStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const difficultyBadgeLabel: Record<CourseDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  all_levels: 'All Levels',
};

/**
 * Enrolled courses only — not a catalog.
 * Shape mirrors future GET /student/enrollments response items.
 */
export const enrolledCourses: EnrolledCourseDto[] = [
  {
    id: 'course_001',
    slug: 'graphology-foundation',
    title: 'Graphology Foundations',
    description: 'Course description placeholder for your enrolled foundations program.',
    status: 'in_progress',
    difficulty: 'beginner',
    instructor: {
      id: 'teacher_001',
      name: 'Placeholder Instructor',
    },
    media: {
      thumbnailUrl: null,
      thumbnailAlt: 'Course thumbnail placeholder',
    },
    progress: {
      completedLessons: 4,
      totalLessons: 12,
      percentage: 35,
      estimatedTimeRemaining: 'Time remaining placeholder',
    },
    lastAccessedAt: '2026-07-10T10:00:00.000Z',
  },
  {
    id: 'course_002',
    slug: 'advanced-graphology',
    title: 'Advanced Graphology',
    description: 'Course description placeholder for your enrolled advanced program.',
    status: 'not_started',
    difficulty: 'intermediate',
    instructor: {
      id: 'teacher_001',
      name: 'Placeholder Instructor',
    },
    media: {
      thumbnailUrl: null,
      thumbnailAlt: 'Course thumbnail placeholder',
    },
    progress: {
      completedLessons: 0,
      totalLessons: 16,
      percentage: 0,
      estimatedTimeRemaining: 'Time remaining placeholder',
    },
    lastAccessedAt: null,
  },
  {
    id: 'course_003',
    slug: 'handwriting-improvement',
    title: 'Handwriting Improvement',
    description: 'Course description placeholder for your enrolled handwriting program.',
    status: 'completed',
    difficulty: 'all_levels',
    instructor: {
      id: 'teacher_001',
      name: 'Placeholder Instructor',
    },
    media: {
      thumbnailUrl: null,
      thumbnailAlt: 'Course thumbnail placeholder',
    },
    progress: {
      completedLessons: 10,
      totalLessons: 10,
      percentage: 100,
      estimatedTimeRemaining: null,
    },
    lastAccessedAt: '2026-07-08T14:30:00.000Z',
  },
];

export const learningStats: LearningStatDto[] = [
  {
    id: 'streak',
    label: 'Learning Streak',
    value: '—',
    helper: 'Streak tracking placeholder',
  },
  {
    id: 'total',
    label: 'Total Courses',
    value: String(enrolledCourses.length),
    helper: 'Enrolled programs',
  },
  {
    id: 'completed',
    label: 'Completed Courses',
    value: String(enrolledCourses.filter((course) => course.status === 'completed').length),
    helper: 'Finished enrollments',
  },
  {
    id: 'hours',
    label: 'Hours Learned',
    value: '—',
    helper: 'Hours tracking placeholder',
  },
];

export const continueLearningItem: ContinueLearningDto = {
  course: {
    id: 'course_001',
    slug: 'graphology-foundation',
    title: 'Graphology Foundations',
  },
  nextLesson: {
    id: 'lesson_003',
    title: 'Next lesson placeholder',
  },
  progress: {
    percentage: 35,
  },
};

export const recentlyAccessedItems: RecentlyAccessedDto[] = [
  {
    course: {
      id: 'course_001',
      slug: 'graphology-foundation',
      title: 'Graphology Foundations',
    },
    accessedAt: '2026-07-10T10:00:00.000Z',
  },
  {
    course: {
      id: 'course_003',
      slug: 'handwriting-improvement',
      title: 'Handwriting Improvement',
    },
    accessedAt: '2026-07-08T14:30:00.000Z',
  },
];

export function formatLastAccessedLabel(lastAccessedAt: string | null): string {
  if (!lastAccessedAt) {
    return learningPageCopy.notAccessedYet;
  }
  return learningPageCopy.accessedPlaceholder;
}

export function filterEnrolledCourses(
  courses: EnrolledCourseDto[],
  query: string,
  status: CourseStatusFilter,
): EnrolledCourseDto[] {
  const normalized = query.trim().toLowerCase();

  return courses.filter((course) => {
    const matchesStatus = status === 'all' || course.status === status;
    if (!matchesStatus) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      course.title.toLowerCase().includes(normalized) ||
      course.description.toLowerCase().includes(normalized) ||
      course.instructor.name.toLowerCase().includes(normalized) ||
      course.slug.toLowerCase().includes(normalized)
    );
  });
}

export function sortEnrolledCourses(
  courses: EnrolledCourseDto[],
  sort: CourseSortOption,
): EnrolledCourseDto[] {
  const next = [...courses];

  switch (sort) {
    case 'alphabetical':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'progress':
      return next.sort((a, b) => b.progress.percentage - a.progress.percentage);
    case 'recent':
    default:
      return next.sort((a, b) => {
        const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return bTime - aTime;
      });
  }
}
