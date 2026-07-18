import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type {
  StudentCourseCardDto,
  StudentCourseDetailDto,
  StudentLessonPlayerDto,
  StudentProgressOverviewDto,
} from '../../../lib/student';
import {
  applyOptimisticLessonComplete,
  deriveProgressMilestones,
  resolveResumeLessonId,
  toEnrollmentApiStatus,
  toEnrollmentListSort,
} from './learning-helpers';
import { studentCoursesPageCopy, studentLessonPlayerCopy, studentProgressPageCopy } from './copy';

const webRoot = process.cwd();

function readWebFile(...parts: string[]): string {
  return readFileSync(join(webRoot, ...parts), 'utf8');
}

function sampleCourseCard(overrides: Partial<StudentCourseCardDto> = {}): StudentCourseCardDto {
  return {
    enrollmentId: 'enr_1',
    course: { id: 'course_1', slug: 'foundations', title: 'Foundations' },
    batch: { id: 'batch_1', name: 'Morning Batch' },
    description: 'Intro course',
    enrollmentStatus: 'active',
    learningStatus: 'in_progress',
    progress: {
      completedLessons: 1,
      totalLessons: 3,
      percentage: 33,
      resumeLessonId: 'lesson_2',
    },
    enrolledAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    lastProgressAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
    ...overrides,
  };
}

function sampleDetail(): StudentCourseDetailDto {
  return {
    ...sampleCourseCard(),
    modules: [
      {
        id: 'mod_1',
        title: 'Module',
        displayOrder: 1,
        progress: { completedLessons: 1, totalLessons: 3, percentage: 33 },
        lessons: [
          {
            id: 'lesson_1',
            title: 'Intro',
            description: '',
            contentType: 'video',
            contentUrl: null,
            durationSeconds: 60,
            displayOrder: 1,
            moduleId: 'mod_1',
            progressStatus: 'completed',
            progressPercent: 100,
            completedAt: '2026-01-02T00:00:00.000Z',
          },
          {
            id: 'lesson_2',
            title: 'Practice',
            description: '',
            contentType: 'exercise',
            contentUrl: null,
            durationSeconds: null,
            displayOrder: 2,
            moduleId: 'mod_1',
            progressStatus: 'in_progress',
            progressPercent: 40,
            completedAt: null,
          },
          {
            id: 'lesson_3',
            title: 'Wrap',
            description: '',
            contentType: 'reading',
            contentUrl: null,
            durationSeconds: null,
            displayOrder: 3,
            moduleId: 'mod_1',
            progressStatus: 'not_started',
            progressPercent: 0,
            completedAt: null,
          },
        ],
      },
    ],
    capabilities: {
      mediaThumbnails: 'coming_soon',
      moduleTitles: 'coming_soon',
      teacherProfile: 'coming_soon',
    },
  };
}

function samplePlayer(
  overrides: Partial<StudentLessonPlayerDto['lesson']> = {},
): StudentLessonPlayerDto {
  const detail = sampleDetail();
  const moduleLessons = detail.modules[0]?.lessons ?? [];
  const lesson = moduleLessons[1] ?? moduleLessons[0];
  if (!lesson) {
    throw new Error('sampleDetail must include at least one lesson');
  }
  return {
    course: {
      id: detail.course.id,
      slug: detail.course.slug,
      title: detail.course.title,
      progress: detail.progress,
    },
    lesson: {
      ...lesson,
      lastPositionSeconds: 12,
      navigation: {
        previousLessonId: 'lesson_1',
        nextLessonId: 'lesson_3',
      },
      ...overrides,
    },
    curriculum: detail.modules,
    capabilities: {
      videoStreaming: 'disabled',
      pdfViewer: 'disabled',
      lessonNotes: 'coming_soon',
      lessonResources: 'coming_soon',
      bookmarks: 'coming_soon',
      downloads: 'coming_soon',
    },
  };
}

describe('student learning helpers', () => {
  it('maps enrollment status and sort filters for API pagination', () => {
    expect(toEnrollmentApiStatus('all')).toBeUndefined();
    expect(toEnrollmentApiStatus('active')).toBe('ACTIVE');
    expect(toEnrollmentApiStatus('completed')).toBe('COMPLETED');
    expect(toEnrollmentApiStatus('dropped')).toBe('DROPPED');
    expect(toEnrollmentListSort('recent')).toEqual({
      sortBy: 'enrolledAt',
      sortOrder: 'desc',
    });
    expect(toEnrollmentListSort('updated')).toEqual({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
    expect(toEnrollmentListSort('status')).toEqual({
      sortBy: 'status',
      sortOrder: 'asc',
    });
  });

  it('resumes from in-progress lessons before first incomplete', () => {
    const detail = sampleDetail();
    expect(resolveResumeLessonId(detail)).toBe('lesson_2');

    const firstModule = detail.modules[0];
    const secondLesson = firstModule?.lessons[1];
    if (!firstModule || !secondLesson) {
      throw new Error('expected sample lessons');
    }
    secondLesson.progressStatus = 'not_started';
    detail.progress.resumeLessonId = 'lesson_3';
    expect(resolveResumeLessonId(detail)).toBe('lesson_3');
  });

  it('applies optimistic completion with rollback-friendly snapshot', () => {
    const player = samplePlayer();
    const optimistic = applyOptimisticLessonComplete(player);

    expect(optimistic.lesson.progressStatus).toBe('completed');
    expect(optimistic.lesson.progressPercent).toBe(100);
    expect(optimistic.course.progress.completedLessons).toBe(2);
    expect(optimistic.course.progress.percentage).toBe(67);

    // Original untouched for rollback
    expect(player.lesson.progressStatus).toBe('in_progress');
    expect(player.course.progress.completedLessons).toBe(1);
  });

  it('derives milestones strictly from completion thresholds', () => {
    const overview: StudentProgressOverviewDto = {
      completedLessons: 5,
      totalLessons: 10,
      percentage: 50,
      remainingLessons: 5,
      courses: [],
      milestones: null,
      certificatesUnlocked: 0,
    };

    const milestones = deriveProgressMilestones(overview);
    expect(milestones.map((item) => item.threshold)).toEqual([25, 50, 75, 100]);
    expect(milestones.filter((item) => item.unlocked).map((item) => item.threshold)).toEqual([
      25, 50,
    ]);
  });
});

describe('student learning data-state copy', () => {
  it('exposes loading/error/empty language for courses and progress', () => {
    expect(studentCoursesPageCopy.errorTitle).toMatch(/could not load/i);
    expect(studentCoursesPageCopy.emptyTitle).toBeTruthy();
    expect(studentCoursesPageCopy.retryLabel).toBe('Retry');
    expect(studentProgressPageCopy.errorTitle).toMatch(/could not load/i);
    expect(studentProgressPageCopy.emptyTitle).toBeTruthy();
    expect(studentLessonPlayerCopy.completeError).toMatch(/restored/i);
    expect(studentLessonPlayerCopy.resourcesUnavailable).toMatch(/not available/i);
    expect(studentLessonPlayerCopy.notesUnavailable).toMatch(/not available/i);
  });
});

describe('student learning route no-mock behavior', () => {
  const routeFiles = [
    ['app', 'dashboard', 'learning', 'page.tsx'],
    ['app', 'dashboard', 'learning', '[courseId]', 'page.tsx'],
    ['app', 'dashboard', 'learning', '[courseId]', 'lesson', '[lessonId]', 'page.tsx'],
    ['app', 'dashboard', 'progress', 'page.tsx'],
  ] as const;

  const componentFiles = [
    ['components', 'dashboard', 'student-learning', 'my-courses-view.tsx'],
    ['components', 'dashboard', 'student-learning', 'course-details-workspace.tsx'],
    ['components', 'dashboard', 'student-learning', 'lesson-player-workspace.tsx'],
    ['components', 'dashboard', 'student-learning', 'progress-workspace.tsx'],
  ] as const;

  it('wires routes to student-learning workspaces only', () => {
    for (const parts of routeFiles) {
      const source = readWebFile(...parts);
      expect(source).toMatch(/student-learning/);
      expect(source).not.toMatch(/mock-/);
      expect(source).not.toMatch(/placeholder-data/);
      expect(source).not.toMatch(/from ['"].*lib\/dashboard['"]/);
      expect(source).not.toMatch(/getCourseDetailsById|getLessonPlayerData|MyLearningView/);
    }
  });

  it('uses StudentApi through client workspaces without raw fetch or mocks', () => {
    for (const parts of componentFiles) {
      const source = readWebFile(...parts);
      expect(source).toMatch(/StudentApi/);
      expect(source).not.toMatch(/\bfetch\s*\(/);
      expect(source).not.toMatch(/mock-/);
      expect(source).not.toMatch(/placeholder-data/);
      expect(source).not.toMatch(/enrolledCourses|getCourseDetailsById|getLessonPlayerData/);
    }

    const player = readWebFile(
      'components',
      'dashboard',
      'student-learning',
      'lesson-player-workspace.tsx',
    );
    expect(player).toMatch(/markLessonComplete/);
    expect(player).toMatch(/applyOptimisticLessonComplete/);
    expect(player).toMatch(/setCompleteError|completeError/);

    const courses = readWebFile(
      'components',
      'dashboard',
      'student-learning',
      'my-courses-view.tsx',
    );
    expect(courses).toMatch(/toEnrollmentApiStatus|toEnrollmentListSort/);
    expect(courses).toMatch(/StudentCoursesPagination|meta\.totalPages|page/);
    expect(courses).toMatch(/viewState === 'loading'|viewState === 'error'|viewState === 'empty'/);
  });
});
