/**
 * Lesson Player DTOs — shaped like future GET /courses/:slug/lessons/:lessonId responses.
 * Content engine payload: Course → Module → Lesson → Content Blocks.
 */

export type LessonPlayerViewState = 'loading' | 'empty' | 'error' | 'populated';

/** Matches future API lesson type enum (uppercase wire format). */
export type LessonContentType = 'VIDEO' | 'READING' | 'PDF' | 'EXERCISE' | 'UNKNOWN';

export type LessonProgressStatus = 'locked' | 'available' | 'current' | 'completed';

export type LessonResourceKind = 'pdf' | 'zip' | 'link' | 'worksheet';

export type ReadingBlockType =
  | 'heading'
  | 'paragraph'
  | 'callout'
  | 'quote'
  | 'image'
  | 'code';

export interface ProgressPercentDto {
  percentage: number;
  completedItems: number;
  totalItems: number;
}

export interface LessonDurationDto {
  minutes: number;
  label: string;
}

export interface LessonResourceDto {
  id: string;
  title: string;
  description: string;
  kind: LessonResourceKind;
  fileName: string | null;
  url: string | null;
}

export interface LessonNotesDto {
  content: string | null;
  updatedAt: string | null;
  /** Future: autosave / sync status */
  syncStatus: 'local_placeholder';
}

export interface LessonNavigationDto {
  previousLessonId: string | null;
  nextLessonId: string | null;
}

/** Discriminated content payloads per lesson type */
export interface VideoContentDto {
  type: 'VIDEO';
  durationLabel: string;
  posterAlt: string;
  transcriptPlaceholder: string;
  streamUrl: string | null;
}

export interface ReadingBlockDto {
  id: string;
  type: ReadingBlockType;
  text?: string;
  level?: 2 | 3;
  variant?: 'info' | 'tip' | 'warning';
  attribution?: string;
  imageAlt?: string;
  language?: string;
  code?: string;
}

export interface ReadingContentDto {
  type: 'READING';
  estimatedReadingMinutes: number;
  blocks: ReadingBlockDto[];
}

export interface PdfContentDto {
  type: 'PDF';
  documentTitle: string;
  pageCountLabel: string;
  previewAlt: string;
  fileUrl: string | null;
}

export interface ExerciseContentDto {
  type: 'EXERCISE';
  instructions: string;
  questionPlaceholder: string;
  submissionEnabled: boolean;
}

export interface UnknownContentDto {
  type: 'UNKNOWN';
  message: string;
}

export type LessonContentDto =
  | VideoContentDto
  | ReadingContentDto
  | PdfContentDto
  | ExerciseContentDto
  | UnknownContentDto;

/** Future expansion flags — architecture only */
export interface LessonFeaturesDto {
  assignmentsEnabled: boolean;
  quizzesEnabled: boolean;
  codingLabsEnabled: boolean;
  aiTutorEnabled: boolean;
  discussionEnabled: boolean;
  bookmarksEnabled: boolean;
  commentsEnabled: boolean;
  highlightsEnabled: boolean;
  downloadsEnabled: boolean;
  liveSessionsEnabled: boolean;
}

export interface LessonOutlineDto {
  id: string;
  title: string;
  type: LessonContentType;
  duration: LessonDurationDto;
  status: LessonProgressStatus;
  moduleId: string;
}

export interface ModuleOutlineDto {
  id: string;
  number: number;
  title: string;
  defaultExpanded?: boolean;
  progress: ProgressPercentDto;
  lessons: LessonOutlineDto[];
}

export interface LessonDetailDto {
  id: string;
  title: string;
  type: LessonContentType;
  duration: LessonDurationDto;
  status: LessonProgressStatus;
  isBookmarked: boolean;
  moduleId: string;
  content: LessonContentDto;
  resources: LessonResourceDto[];
  notes: LessonNotesDto;
  progress: {
    percentage: number;
    completed: boolean;
  };
  navigation: LessonNavigationDto;
  features: LessonFeaturesDto;
}

export interface LessonPlayerCourseDto {
  id: string;
  slug: string;
  title: string;
  progress: ProgressPercentDto;
}

export interface LessonPlayerModuleDto {
  id: string;
  number: number;
  title: string;
  progress: ProgressPercentDto;
}

/** Aggregate DTO for the Lesson Player page */
export interface LessonPlayerDto {
  course: LessonPlayerCourseDto;
  module: LessonPlayerModuleDto;
  lesson: LessonDetailDto;
  curriculum: ModuleOutlineDto[];
}

export const lessonPlayerViewState: LessonPlayerViewState = 'populated';

export const lessonPlayerCopy = {
  breadcrumbLearning: 'My Learning',
  backToCourse: 'Back to Course',
  previousLesson: 'Previous Lesson',
  nextLesson: 'Next Lesson',
  bookmark: 'Bookmark',
  bookmarked: 'Bookmarked',
  share: 'Share',
  openCurriculum: 'Course outline',
  closeCurriculum: 'Close outline',
  curriculumLabel: 'Course curriculum',
  notesTitle: 'Lesson Notes',
  notesPlaceholder: 'Notes editor placeholder — saving will be available later.',
  notesHelper: 'Notes are local placeholders only.',
  resourcesTitle: 'Lesson Resources',
  resourcesEmpty: 'No resources for this lesson yet.',
  progressCourse: 'Course Progress',
  progressModule: 'Module Progress',
  progressLesson: 'Lesson Progress',
  completionCompleted: 'Completed',
  completionCurrent: 'In progress',
  completionAvailable: 'Not started',
  completionLocked: 'Locked',
  videoPlay: 'Play placeholder',
  videoTranscript: 'Transcript',
  pdfPreview: 'Document preview',
  pdfDownload: 'Download',
  pdfOpen: 'Open',
  exerciseSubmit: 'Submit answer',
  exerciseInstructions: 'Instructions',
  exerciseQuestion: 'Question',
  emptyTitle: 'Lesson not found',
  emptyDescription: 'This lesson is unavailable or does not exist for this course.',
  errorTitle: 'Unable to load lesson',
  errorDescription: 'Something went wrong while loading the lesson player. Please try again.',
  unknownTitle: 'Unsupported lesson type',
  readingTime: 'Estimated reading time',
} as const;

export const lessonTypeLabel: Record<LessonContentType, string> = {
  VIDEO: 'Video',
  READING: 'Reading',
  PDF: 'PDF',
  EXERCISE: 'Exercise',
  UNKNOWN: 'Unknown',
};

export const lessonResourceKindLabel: Record<LessonResourceKind, string> = {
  pdf: 'PDF',
  zip: 'ZIP',
  link: 'Link',
  worksheet: 'Worksheet',
};

export const lessonStatusLabel: Record<LessonProgressStatus, string> = {
  locked: 'Locked',
  available: 'Available',
  current: 'Current',
  completed: 'Completed',
};

const defaultFeatures: LessonFeaturesDto = {
  assignmentsEnabled: false,
  quizzesEnabled: false,
  codingLabsEnabled: false,
  aiTutorEnabled: false,
  discussionEnabled: false,
  bookmarksEnabled: true,
  commentsEnabled: false,
  highlightsEnabled: false,
  downloadsEnabled: false,
  liveSessionsEnabled: false,
};

function sharedResources(prefix: string): LessonResourceDto[] {
  return [
    {
      id: `${prefix}_res_pdf`,
      title: 'Lesson handout',
      description: 'Resource description placeholder.',
      kind: 'pdf',
      fileName: 'lesson-handout.pdf',
      url: null,
    },
    {
      id: `${prefix}_res_zip`,
      title: 'Practice pack',
      description: 'Resource description placeholder.',
      kind: 'zip',
      fileName: 'practice-pack.zip',
      url: null,
    },
    {
      id: `${prefix}_res_link`,
      title: 'Reference link',
      description: 'External reference placeholder.',
      kind: 'link',
      fileName: null,
      url: null,
    },
    {
      id: `${prefix}_res_ws`,
      title: 'Worksheet',
      description: 'Worksheet placeholder.',
      kind: 'worksheet',
      fileName: 'worksheet.pdf',
      url: null,
    },
  ];
}

function buildFoundationLessons(): Record<string, LessonDetailDto> {
  return {
    introduction: {
      id: 'introduction',
      title: 'Introduction to Graphology',
      type: 'VIDEO',
      duration: { minutes: 12, label: '12 min' },
      status: 'completed',
      isBookmarked: false,
      moduleId: 'module_001',
      content: {
        type: 'VIDEO',
        durationLabel: '12:00',
        posterAlt: 'Video player placeholder',
        transcriptPlaceholder:
          'Transcript placeholder. Full captions will appear here when media is connected.',
        streamUrl: null,
      },
      resources: sharedResources('introduction'),
      notes: {
        content: null,
        updatedAt: null,
        syncStatus: 'local_placeholder',
      },
      progress: { percentage: 100, completed: true },
      navigation: { previousLessonId: null, nextLessonId: 'handwriting-basics' },
      features: defaultFeatures,
    },
    'handwriting-basics': {
      id: 'handwriting-basics',
      title: 'Handwriting Basics',
      type: 'READING',
      duration: { minutes: 8, label: '8 min' },
      status: 'completed',
      isBookmarked: false,
      moduleId: 'module_001',
      content: {
        type: 'READING',
        estimatedReadingMinutes: 8,
        blocks: [
          {
            id: 'rb_1',
            type: 'heading',
            level: 2,
            text: 'What this lesson covers',
          },
          {
            id: 'rb_2',
            type: 'paragraph',
            text: 'Reading content placeholder. This section introduces foundational concepts with premium typography for long-form learning.',
          },
          {
            id: 'rb_3',
            type: 'callout',
            variant: 'tip',
            text: 'Callout placeholder — key takeaways will appear here.',
          },
          {
            id: 'rb_4',
            type: 'heading',
            level: 3,
            text: 'Observing stroke patterns',
          },
          {
            id: 'rb_5',
            type: 'paragraph',
            text: 'Additional reading placeholder describing how learners observe baseline, slant, and pressure without claiming diagnostic outcomes.',
          },
          {
            id: 'rb_6',
            type: 'quote',
            text: 'Quote block placeholder for mentor guidance or excerpted reading.',
            attribution: 'Placeholder source',
          },
          {
            id: 'rb_7',
            type: 'image',
            imageAlt: 'Reading image placeholder',
          },
          {
            id: 'rb_8',
            type: 'code',
            language: 'text',
            code: '// Code block placeholder — future labs may render syntax here\nstroke.observe("baseline")',
          },
        ],
      },
      resources: sharedResources('handwriting-basics'),
      notes: {
        content: 'Notes placeholder text.',
        updatedAt: '2026-07-10T12:00:00.000Z',
        syncStatus: 'local_placeholder',
      },
      progress: { percentage: 100, completed: true },
      navigation: { previousLessonId: 'introduction', nextLessonId: 'reference-sheet' },
      features: defaultFeatures,
    },
    'reference-sheet': {
      id: 'reference-sheet',
      title: 'Reference Sheet',
      type: 'PDF',
      duration: { minutes: 5, label: '5 min' },
      status: 'current',
      isBookmarked: true,
      moduleId: 'module_001',
      content: {
        type: 'PDF',
        documentTitle: 'Graphology reference sheet',
        pageCountLabel: 'Page count placeholder',
        previewAlt: 'PDF document preview placeholder',
        fileUrl: null,
      },
      resources: sharedResources('reference-sheet'),
      notes: {
        content: null,
        updatedAt: null,
        syncStatus: 'local_placeholder',
      },
      progress: { percentage: 40, completed: false },
      navigation: { previousLessonId: 'handwriting-basics', nextLessonId: 'practice-drill' },
      features: defaultFeatures,
    },
    'practice-drill': {
      id: 'practice-drill',
      title: 'Practice Drill',
      type: 'EXERCISE',
      duration: { minutes: 15, label: '15 min' },
      status: 'available',
      isBookmarked: false,
      moduleId: 'module_001',
      content: {
        type: 'EXERCISE',
        instructions:
          'Instruction card placeholder. Follow the steps when interactive exercises are enabled.',
        questionPlaceholder: 'Question placeholder — describe what you observe in the sample.',
        submissionEnabled: false,
      },
      resources: sharedResources('practice-drill'),
      notes: {
        content: null,
        updatedAt: null,
        syncStatus: 'local_placeholder',
      },
      progress: { percentage: 0, completed: false },
      navigation: { previousLessonId: 'reference-sheet', nextLessonId: 'pressure-study' },
      features: defaultFeatures,
    },
    'pressure-study': {
      id: 'pressure-study',
      title: 'Pressure Study',
      type: 'VIDEO',
      duration: { minutes: 10, label: '10 min' },
      status: 'locked',
      isBookmarked: false,
      moduleId: 'module_001',
      content: {
        type: 'VIDEO',
        durationLabel: '10:00',
        posterAlt: 'Video player placeholder',
        transcriptPlaceholder: 'Transcript placeholder.',
        streamUrl: null,
      },
      resources: [],
      notes: {
        content: null,
        updatedAt: null,
        syncStatus: 'local_placeholder',
      },
      progress: { percentage: 0, completed: false },
      navigation: { previousLessonId: 'practice-drill', nextLessonId: 'advanced-overview' },
      features: defaultFeatures,
    },
    'advanced-overview': {
      id: 'advanced-overview',
      title: 'Advanced Overview',
      type: 'READING',
      duration: { minutes: 14, label: '14 min' },
      status: 'locked',
      isBookmarked: false,
      moduleId: 'module_002',
      content: {
        type: 'READING',
        estimatedReadingMinutes: 14,
        blocks: [
          {
            id: 'ao_1',
            type: 'heading',
            level: 2,
            text: 'Module overview placeholder',
          },
          {
            id: 'ao_2',
            type: 'paragraph',
            text: 'Locked reading content placeholder for the next module.',
          },
        ],
      },
      resources: [],
      notes: {
        content: null,
        updatedAt: null,
        syncStatus: 'local_placeholder',
      },
      progress: { percentage: 0, completed: false },
      navigation: { previousLessonId: 'pressure-study', nextLessonId: 'unsupported-format' },
      features: defaultFeatures,
    },
    'unsupported-format': {
      id: 'unsupported-format',
      title: 'Unsupported Format Sample',
      type: 'UNKNOWN',
      duration: { minutes: 1, label: '1 min' },
      status: 'locked',
      isBookmarked: false,
      moduleId: 'module_002',
      content: {
        type: 'UNKNOWN',
        message: 'This lesson type is not supported in the current player build.',
      },
      resources: [],
      notes: {
        content: null,
        updatedAt: null,
        syncStatus: 'local_placeholder',
      },
      progress: { percentage: 0, completed: false },
      navigation: { previousLessonId: 'advanced-overview', nextLessonId: null },
      features: defaultFeatures,
    },
  };
}

function outlineFromLessons(
  moduleId: string,
  number: number,
  title: string,
  lessonIds: string[],
  lessons: Record<string, LessonDetailDto>,
  defaultExpanded?: boolean,
): ModuleOutlineDto {
  const moduleLessons = lessonIds.map((id) => {
    const lesson = lessons[id];
    if (!lesson) {
      throw new Error(`Missing lesson mock for id: ${id}`);
    }
    return {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      duration: lesson.duration,
      status: lesson.status,
      moduleId,
    } satisfies LessonOutlineDto;
  });

  const completedItems = moduleLessons.filter((l) => l.status === 'completed').length;

  return {
    id: moduleId,
    number,
    title,
    defaultExpanded,
    progress: {
      percentage: Math.round((completedItems / moduleLessons.length) * 100),
      completedItems,
      totalItems: moduleLessons.length,
    },
    lessons: moduleLessons,
  };
}

interface CourseLessonTree {
  course: LessonPlayerCourseDto;
  modules: ModuleOutlineDto[];
  lessons: Record<string, LessonDetailDto>;
}

function buildFoundationTree(): CourseLessonTree {
  const lessons = buildFoundationLessons();
  const modules = [
    outlineFromLessons(
      'module_001',
      1,
      'Foundations',
      ['introduction', 'handwriting-basics', 'reference-sheet', 'practice-drill', 'pressure-study'],
      lessons,
      true,
    ),
    outlineFromLessons(
      'module_002',
      2,
      'Going Further',
      ['advanced-overview', 'unsupported-format'],
      lessons,
      false,
    ),
  ];

  const allLessons = Object.values(lessons);
  const completedItems = allLessons.filter((l) => l.status === 'completed').length;

  return {
    course: {
      id: 'course_001',
      slug: 'graphology-foundation',
      title: 'Graphology Foundations',
      progress: {
        percentage: Math.round((completedItems / allLessons.length) * 100),
        completedItems,
        totalItems: allLessons.length,
      },
    },
    modules,
    lessons,
  };
}

function buildSecondaryTree(input: {
  id: string;
  slug: string;
  title: string;
}): CourseLessonTree {
  const lessonId = 'introduction';
  const lessons: Record<string, LessonDetailDto> = {
    [lessonId]: {
      id: lessonId,
      title: 'Introduction',
      type: 'VIDEO',
      duration: { minutes: 10, label: '10 min' },
      status: 'available',
      isBookmarked: false,
      moduleId: 'module_001',
      content: {
        type: 'VIDEO',
        durationLabel: '10:00',
        posterAlt: 'Video player placeholder',
        transcriptPlaceholder: 'Transcript placeholder.',
        streamUrl: null,
      },
      resources: sharedResources(lessonId),
      notes: {
        content: null,
        updatedAt: null,
        syncStatus: 'local_placeholder',
      },
      progress: { percentage: 0, completed: false },
      navigation: { previousLessonId: null, nextLessonId: null },
      features: defaultFeatures,
    },
  };

  return {
    course: {
      id: input.id,
      slug: input.slug,
      title: input.title,
      progress: { percentage: 0, completedItems: 0, totalItems: 1 },
    },
    modules: [
      outlineFromLessons('module_001', 1, 'Getting Started', [lessonId], lessons, true),
    ],
    lessons,
  };
}

/** Catalog keyed by course slug (and mirrored by course id). */
export const lessonCourseCatalog: CourseLessonTree[] = [
  buildFoundationTree(),
  buildSecondaryTree({
    id: 'course_002',
    slug: 'advanced-graphology',
    title: 'Advanced Graphology',
  }),
  buildSecondaryTree({
    id: 'course_003',
    slug: 'handwriting-improvement',
    title: 'Handwriting Improvement',
  }),
];

const lessonCourseByKey: Record<string, CourseLessonTree> = Object.fromEntries(
  lessonCourseCatalog.flatMap((tree) => [
    [tree.course.slug, tree],
    [tree.course.id, tree],
  ]),
);

export function getLessonCourseTree(courseIdOrSlug: string): CourseLessonTree | null {
  return lessonCourseByKey[courseIdOrSlug] ?? null;
}

export function getLessonPlayerData(
  courseIdOrSlug: string,
  lessonId: string,
): LessonPlayerDto | null {
  const tree = getLessonCourseTree(courseIdOrSlug);
  if (!tree) {
    return null;
  }

  const lesson = tree.lessons[lessonId];
  if (!lesson) {
    return null;
  }

  const currentModule = tree.modules.find((item) => item.id === lesson.moduleId);
  if (!currentModule) {
    return null;
  }

  return {
    course: tree.course,
    module: {
      id: currentModule.id,
      number: currentModule.number,
      title: currentModule.title,
      progress: currentModule.progress,
    },
    lesson,
    curriculum: tree.modules,
  };
}

export function getDefaultLessonId(courseIdOrSlug: string): string | null {
  const tree = getLessonCourseTree(courseIdOrSlug);
  if (!tree) {
    return null;
  }

  const flat = tree.modules.flatMap((moduleItem) => moduleItem.lessons);
  const current = flat.find((lessonItem) => lessonItem.status === 'current');
  if (current) {
    return current.id;
  }

  const available = flat.find(
    (lessonItem) => lessonItem.status === 'available' || lessonItem.status === 'completed',
  );
  return available?.id ?? flat[0]?.id ?? null;
}

export function listLessonIdsForCourse(courseIdOrSlug: string): string[] {
  const tree = getLessonCourseTree(courseIdOrSlug);
  if (!tree) {
    return [];
  }
  return tree.modules.flatMap((moduleItem) =>
    moduleItem.lessons.map((lessonItem) => lessonItem.id),
  );
}

export function completionStatusLabel(status: LessonProgressStatus): string {
  switch (status) {
    case 'completed':
      return lessonPlayerCopy.completionCompleted;
    case 'current':
      return lessonPlayerCopy.completionCurrent;
    case 'locked':
      return lessonPlayerCopy.completionLocked;
    default:
      return lessonPlayerCopy.completionAvailable;
  }
}
