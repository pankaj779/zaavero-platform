/**
 * Course Details DTOs — shaped like future GET /courses/:slug (or /enrollments/:id/course) responses.
 */

import type { CourseDifficulty } from './mock-learning';

export type CourseDetailsViewState = 'loading' | 'empty' | 'error' | 'populated';
export type LessonType = 'video' | 'reading' | 'exercise';
export type LessonProgressStatus = 'locked' | 'available' | 'current' | 'completed';
export type CourseTabId = 'overview' | 'curriculum' | 'resources' | 'announcements';
export type ResourceType = 'pdf' | 'guide' | 'practice' | 'download';
export type CertificateAvailability = 'included' | 'not_included' | 'coming_soon';

export interface InstructorDto {
  id: string;
  name: string;
}

export interface CourseProgressDto {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  estimatedTimeRemaining: string | null;
}

export interface CourseCertificateDto {
  status: CertificateAvailability;
  label: string;
}

export interface CourseMetaDto {
  duration: string;
  language: string;
  certificate: CourseCertificateDto;
}

export interface CourseMediaDto {
  imageUrl: string | null;
  imageAlt: string;
}

export interface CourseLessonDto {
  id: string;
  number: number;
  title: string;
  type: LessonType;
  duration: {
    minutes: number;
    label: string;
  };
  status: LessonProgressStatus;
  /** Reserved for future lesson player */
  contentUrl: string | null;
}

export interface CourseModuleDto {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: CourseLessonDto[];
  defaultExpanded?: boolean;
}

export interface CourseResourceDto {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  fileName: string;
  downloadUrl: string | null;
}

export interface CourseAnnouncementDto {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
}

export interface CourseFeaturesDto {
  assignmentsEnabled: boolean;
  quizzesEnabled: boolean;
  discussionsEnabled: boolean;
  notesEnabled: boolean;
  bookmarksEnabled: boolean;
  liveClassesEnabled: boolean;
  aiTutorEnabled: boolean;
}

/** Full course details aggregate — future backend DTO */
export interface CourseDetailsDto {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  difficulty: CourseDifficulty;
  instructor: InstructorDto;
  media: CourseMediaDto;
  progress: CourseProgressDto;
  meta: CourseMetaDto;
  learningObjectives: string[];
  skills: string[];
  prerequisites: string[];
  modules: CourseModuleDto[];
  resources: CourseResourceDto[];
  announcements: CourseAnnouncementDto[];
  features: CourseFeaturesDto;
}

export const courseDetailsCopy = {
  breadcrumbLearning: 'My Learning',
  continueLearning: 'Continue Learning',
  instructorLabel: 'Instructor',
  difficultyLabel: 'Difficulty',
  categoryLabel: 'Category',
  progressLabel: 'Progress',
  overviewTab: 'Overview',
  curriculumTab: 'Curriculum',
  resourcesTab: 'Resources',
  announcementsTab: 'Announcements',
  objectivesTitle: 'Learning Objectives',
  skillsTitle: "Skills You'll Learn",
  prerequisitesTitle: 'Prerequisites',
  durationLabel: 'Course Duration',
  languageLabel: 'Language',
  certificateLabel: 'Certificate Availability',
  imageLabel: 'Course image placeholder',
  lessonsCompletedLabel: 'Lessons Completed',
  timeRemainingLabel: 'Estimated Time Remaining',
  certificateStatusLabel: 'Certificate Status',
  emptyTitle: 'Course not found',
  emptyDescription: 'This course is not available in your learning library yet.',
  errorTitle: 'Unable to load course details',
  errorDescription: 'Something went wrong while loading this course. Please try again.',
  resourcesEmpty: 'No resources published yet.',
  announcementsEmpty: 'No announcements yet.',
  lockedLessonHint: 'Locked until previous lessons are completed',
  currentLessonHint: 'Current lesson',
  completedLabel: 'Completed',
} as const;

export const courseTabItems: { id: CourseTabId; label: string }[] = [
  { id: 'overview', label: courseDetailsCopy.overviewTab },
  { id: 'curriculum', label: courseDetailsCopy.curriculumTab },
  { id: 'resources', label: courseDetailsCopy.resourcesTab },
  { id: 'announcements', label: courseDetailsCopy.announcementsTab },
];

export const lessonTypeLabel: Record<LessonType, string> = {
  video: 'Video',
  reading: 'Reading',
  exercise: 'Exercise',
};

export const lessonStatusLabel: Record<LessonProgressStatus, string> = {
  locked: 'Locked',
  available: 'Available',
  current: 'Current',
  completed: 'Completed',
};

export const difficultyLabel: Record<CourseDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  all_levels: 'All Levels',
};

/** Demo view-state switch for Course Details (no backend). */
export const courseDetailsViewState: CourseDetailsViewState = 'populated';

export function formatAnnouncementDate(publishedAt: string): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Date placeholder';
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Lesson ids align with mock-lessons.ts so Course Details can deep-link into the player. */
function buildSampleModules(courseSlug: string): CourseModuleDto[] {
  if (courseSlug === 'graphology-foundation') {
    return [
      {
        id: 'module_001',
        number: 1,
        title: 'Foundations',
        description: 'Module description placeholder.',
        defaultExpanded: true,
        lessons: [
          {
            id: 'introduction',
            number: 1,
            title: 'Introduction to Graphology',
            type: 'video',
            duration: { minutes: 12, label: '12 min' },
            status: 'completed',
            contentUrl: null,
          },
          {
            id: 'handwriting-basics',
            number: 2,
            title: 'Handwriting Basics',
            type: 'reading',
            duration: { minutes: 8, label: '8 min' },
            status: 'completed',
            contentUrl: null,
          },
          {
            id: 'reference-sheet',
            number: 3,
            title: 'Reference Sheet',
            type: 'reading',
            duration: { minutes: 5, label: '5 min' },
            status: 'current',
            contentUrl: null,
          },
          {
            id: 'practice-drill',
            number: 4,
            title: 'Practice Drill',
            type: 'exercise',
            duration: { minutes: 15, label: '15 min' },
            status: 'available',
            contentUrl: null,
          },
          {
            id: 'pressure-study',
            number: 5,
            title: 'Pressure Study',
            type: 'video',
            duration: { minutes: 10, label: '10 min' },
            status: 'locked',
            contentUrl: null,
          },
        ],
      },
      {
        id: 'module_002',
        number: 2,
        title: 'Going Further',
        description: 'Module description placeholder.',
        defaultExpanded: false,
        lessons: [
          {
            id: 'advanced-overview',
            number: 6,
            title: 'Advanced Overview',
            type: 'reading',
            duration: { minutes: 14, label: '14 min' },
            status: 'locked',
            contentUrl: null,
          },
          {
            id: 'unsupported-format',
            number: 7,
            title: 'Unsupported Format Sample',
            type: 'video',
            duration: { minutes: 1, label: '1 min' },
            status: 'locked',
            contentUrl: null,
          },
        ],
      },
    ];
  }

  return [
    {
      id: 'module_001',
      number: 1,
      title: 'Getting Started',
      description: 'Module description placeholder.',
      defaultExpanded: true,
      lessons: [
        {
          id: 'introduction',
          number: 1,
          title: 'Introduction',
          type: 'video',
          duration: { minutes: 10, label: '10 min' },
          status: 'available',
          contentUrl: null,
        },
      ],
    },
  ];
}

function createCourseDetails(input: {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: CourseDifficulty;
  progress: CourseProgressDto;
  certificate: CourseCertificateDto;
}): CourseDetailsDto {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    shortDescription: 'Short course description placeholder for enrolled learners.',
    description:
      'Full course description placeholder. This content will be replaced with the official syllabus when published.',
    category: input.category,
    difficulty: input.difficulty,
    instructor: {
      id: 'teacher_001',
      name: 'Placeholder Instructor',
    },
    media: {
      imageUrl: null,
      imageAlt: 'Course image placeholder',
    },
    progress: input.progress,
    meta: {
      duration: 'Duration placeholder',
      language: 'English',
      certificate: input.certificate,
    },
    learningObjectives: [
      'Learning objective placeholder 1',
      'Learning objective placeholder 2',
      'Learning objective placeholder 3',
    ],
    skills: ['Skill placeholder 1', 'Skill placeholder 2', 'Skill placeholder 3'],
    prerequisites: ['Prerequisite placeholder'],
    modules: buildSampleModules(input.slug),
    resources: [
      {
        id: `${input.id}_resource_001`,
        title: 'Workbook.pdf',
        description: 'Resource description placeholder.',
        type: 'pdf',
        fileName: 'Workbook.pdf',
        downloadUrl: null,
      },
      {
        id: `${input.id}_resource_002`,
        title: 'Reference Guide',
        description: 'Resource description placeholder.',
        type: 'guide',
        fileName: 'reference-guide.pdf',
        downloadUrl: null,
      },
      {
        id: `${input.id}_resource_003`,
        title: 'Practice Sheets',
        description: 'Resource description placeholder.',
        type: 'practice',
        fileName: 'practice-sheets.pdf',
        downloadUrl: null,
      },
      {
        id: `${input.id}_resource_004`,
        title: 'Downloads',
        description: 'Resource description placeholder.',
        type: 'download',
        fileName: 'course-downloads.zip',
        downloadUrl: null,
      },
    ],
    announcements: [
      {
        id: `${input.id}_announcement_001`,
        title: 'Announcement title placeholder',
        description: 'Announcement description placeholder for course updates.',
        publishedAt: '2026-07-09T09:00:00.000Z',
      },
      {
        id: `${input.id}_announcement_002`,
        title: 'Announcement title placeholder',
        description: 'Announcement description placeholder for schedule notes.',
        publishedAt: '2026-07-05T09:00:00.000Z',
      },
    ],
    features: {
      assignmentsEnabled: false,
      quizzesEnabled: false,
      discussionsEnabled: false,
      notesEnabled: false,
      bookmarksEnabled: false,
      liveClassesEnabled: false,
      aiTutorEnabled: false,
    },
  };
}

/**
 * Course catalog keyed by slug (route param).
 * Also resolvable by id via getCourseDetailsById.
 */
export const courseDetailsCatalog: CourseDetailsDto[] = [
  createCourseDetails({
    id: 'course_001',
    slug: 'graphology-foundation',
    title: 'Graphology Foundations',
    category: 'Personal Development',
    difficulty: 'beginner',
    progress: {
      completedLessons: 4,
      totalLessons: 12,
      percentage: 35,
      estimatedTimeRemaining: 'Time remaining placeholder',
    },
    certificate: {
      status: 'included',
      label: 'Certificate included (details coming soon)',
    },
  }),
  createCourseDetails({
    id: 'course_002',
    slug: 'advanced-graphology',
    title: 'Advanced Graphology',
    category: 'Personal Development',
    difficulty: 'intermediate',
    progress: {
      completedLessons: 0,
      totalLessons: 16,
      percentage: 0,
      estimatedTimeRemaining: 'Time remaining placeholder',
    },
    certificate: {
      status: 'coming_soon',
      label: 'Certificate status placeholder',
    },
  }),
  createCourseDetails({
    id: 'course_003',
    slug: 'handwriting-improvement',
    title: 'Handwriting Improvement',
    category: 'Skills',
    difficulty: 'all_levels',
    progress: {
      completedLessons: 10,
      totalLessons: 10,
      percentage: 100,
      estimatedTimeRemaining: null,
    },
    certificate: {
      status: 'included',
      label: 'Certificate included (details coming soon)',
    },
  }),
];

export const courseDetailsById: Record<string, CourseDetailsDto> = Object.fromEntries(
  courseDetailsCatalog.flatMap((course) => [
    [course.slug, course],
    [course.id, course],
  ]),
);

export function getCourseDetailsById(courseIdOrSlug: string): CourseDetailsDto | null {
  return courseDetailsById[courseIdOrSlug] ?? null;
}

export function listCourseDetailIds(): string[] {
  return courseDetailsCatalog.map((course) => course.slug);
}
