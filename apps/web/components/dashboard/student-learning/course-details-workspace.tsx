'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ProgressBar,
  Skeleton,
} from '@graphology/ui';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { DASHBOARD_ROUTES, getLessonPath } from '../../../lib/constants';
import type { StudentCourseDetailDto } from '../../../lib/student';
import { teacherLessonContentTypeLabel } from '../../../lib/teacher/lesson-types';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import {
  studentCourseDetailsCopy,
  studentEnrollmentStatusLabel,
  studentLearningStatusLabel,
  studentLessonPlayerCopy,
} from './copy';
import {
  enrollmentStatusBadgeVariant,
  formatDurationSeconds,
  resolveResumeLessonId,
  type StudentCoursesViewState,
} from './learning-helpers';

function CourseDetailsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading course details">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-2 w-full" />
      <div className="grid gap-4 laptop:grid-cols-[minmax(0,1fr)_16rem]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

function lessonStatusLabel(status: 'not_started' | 'in_progress' | 'completed'): string {
  if (status === 'completed') {
    return studentLessonPlayerCopy.statusCompleted;
  }
  if (status === 'in_progress') {
    return studentLessonPlayerCopy.statusInProgress;
  }
  return studentLessonPlayerCopy.statusNotStarted;
}

export function CourseDetailsWorkspace({
  courseId,
  initialCourse,
  initialViewState,
}: {
  courseId: string;
  initialCourse?: StudentCourseDetailDto | null;
  initialViewState?: StudentCoursesViewState;
}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [viewState, setViewState] = useState<StudentCoursesViewState>(
    initialViewState ?? 'loading',
  );
  const [course, setCourse] = useState<StudentCourseDetailDto | null>(initialCourse ?? null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setCourse(null);
      setViewState('empty');
      return;
    }

    const result = await StudentApi.getCourse(primaryOrganizationId, courseId);
    setCourse(result);
    setViewState(result ? 'populated' : 'empty');
  }, [courseId, primaryOrganizationId]);

  useEffect(() => {
    if (initialViewState !== undefined) {
      return;
    }

    const controller = new AbortController();
    setViewState('loading');
    void (async () => {
      try {
        await load();
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialViewState, load, reloadKey]);

  if (viewState === 'loading') {
    return <CourseDetailsSkeleton />;
  }

  if (viewState === 'error') {
    return (
      <TeacherModuleErrorState
        title={studentCourseDetailsCopy.errorTitle}
        description={studentCourseDetailsCopy.errorDescription}
        retryLabel={studentCourseDetailsCopy.retryLabel}
        onRetry={() => {
          setReloadKey((current) => current + 1);
        }}
      />
    );
  }

  if (viewState === 'empty' || !course) {
    return (
      <div className="space-y-4">
        <TeacherModuleEmptyState
          title={studentCourseDetailsCopy.emptyTitle}
          description={studentCourseDetailsCopy.emptyDescription}
          icon="book"
        />
        <div className="flex justify-center">
          <Button variant="primary" asChild>
            <Link href={DASHBOARD_ROUTES.learning}>{studentCourseDetailsCopy.backToCourses}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const resumeLessonId = resolveResumeLessonId(course);
  const continueHref = resumeLessonId
    ? getLessonPath(course.course.id, resumeLessonId)
    : DASHBOARD_ROUTES.learning;
  const teacherAvailable = course.capabilities.teacherProfile === 'available';

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={enrollmentStatusBadgeVariant(course.enrollmentStatus)}>
            {studentEnrollmentStatusLabel[course.enrollmentStatus]}
          </Badge>
          <Badge variant="neutral">{studentLearningStatusLabel[course.learningStatus]}</Badge>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {course.course.title}
          </h1>
          {course.description ? (
            <p className="max-w-3xl text-small leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          ) : null}
        </div>
        <p className="text-small text-muted-foreground">
          <span className="font-medium text-foreground">
            {studentCourseDetailsCopy.batchLabel}:{' '}
          </span>
          {course.batch.name}
        </p>
        <div className="max-w-xl space-y-2">
          <ProgressBar
            value={course.progress.percentage}
            label={studentCourseDetailsCopy.progressLabel}
          />
          <p className="text-caption text-muted-foreground">
            {studentCourseDetailsCopy.lessonsLabel}: {course.progress.completedLessons}/
            {course.progress.totalLessons}
          </p>
        </div>
        <div className="flex flex-col gap-2 tablet:flex-row">
          {resumeLessonId ? (
            <Button variant="primary" asChild>
              <Link href={continueHref}>
                {course.learningStatus === 'not_started'
                  ? studentCourseDetailsCopy.continueButton
                  : studentCourseDetailsCopy.resumeButton}
              </Link>
            </Button>
          ) : (
            <Button variant="primary" disabled>
              {studentCourseDetailsCopy.continueButton}
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={DASHBOARD_ROUTES.learning}>{studentCourseDetailsCopy.backToCourses}</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_16rem] laptop:items-start">
        <section className="space-y-4" aria-label={studentCourseDetailsCopy.modulesLabel}>
          {course.capabilities.moduleTitles !== 'available' ? (
            <p className="text-caption text-muted-foreground">
              {studentCourseDetailsCopy.moduleTitlesUnavailable}
            </p>
          ) : null}

          {course.modules.length === 0 ? (
            <TeacherModuleEmptyState
              title="No lessons yet"
              description="Lessons for this course have not been published."
              icon="book"
            />
          ) : (
            <ul className="space-y-4 p-0">
              {course.modules.map((module, moduleIndex) => (
                <li key={module.id}>
                  <Card className="rounded-xl shadow-sm">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-base">
                        {module.title === 'Module'
                          ? `Module ${String(moduleIndex + 1)}`
                          : module.title}
                      </CardTitle>
                      <ProgressBar
                        value={module.progress.percentage}
                        label={`Module ${String(moduleIndex + 1)} progress`}
                      />
                    </CardHeader>
                    <CardContent>
                      <ul className="divide-y divide-border rounded-lg border border-border">
                        {module.lessons.map((lesson) => {
                          const durationLabel = formatDurationSeconds(lesson.durationSeconds);
                          return (
                            <li key={lesson.id}>
                              <Link
                                href={getLessonPath(course.course.id, lesson.id)}
                                className="flex flex-col gap-1 px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tablet:flex-row tablet:items-center tablet:justify-between"
                              >
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-foreground">
                                    {lesson.title}
                                  </span>
                                  <span className="block text-caption text-muted-foreground">
                                    {teacherLessonContentTypeLabel[lesson.contentType]}
                                    {durationLabel ? ` · ${durationLabel}` : ''}
                                  </span>
                                </span>
                                <span className="text-caption text-muted-foreground">
                                  {lessonStatusLabel(lesson.progressStatus)} ·{' '}
                                  {lesson.progressPercent}%
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{studentCourseDetailsCopy.teacherLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              {teacherAvailable ? (
                <p className="text-small text-foreground">Teacher details</p>
              ) : (
                <p className="text-small text-muted-foreground">
                  {studentCourseDetailsCopy.teacherUnavailable}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
