'use client';

import { Button, ProgressBar, Skeleton } from '@graphology/ui';
import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { DASHBOARD_ROUTES, getCourseDetailsPath, getLessonPath } from '../../../lib/constants';
import type { StudentLessonPlayerDto } from '../../../lib/student';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { studentLessonPlayerCopy } from './copy';
import { applyOptimisticLessonComplete, type StudentCoursesViewState } from './learning-helpers';
import { StudentLessonContent } from './student-lesson-content';
import { StudentLessonSidebar } from './student-lesson-sidebar';

function LessonPlayerSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading lesson">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="h-10 w-40" />
    </div>
  );
}

function statusLabel(status: 'not_started' | 'in_progress' | 'completed'): string {
  if (status === 'completed') {
    return studentLessonPlayerCopy.statusCompleted;
  }
  if (status === 'in_progress') {
    return studentLessonPlayerCopy.statusInProgress;
  }
  return studentLessonPlayerCopy.statusNotStarted;
}

export function LessonPlayerWorkspace({
  courseId,
  lessonId,
  initialPlayer,
  initialViewState,
}: {
  courseId: string;
  lessonId: string;
  initialPlayer?: StudentLessonPlayerDto | null;
  initialViewState?: StudentCoursesViewState;
}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const outlineId = useId();
  const [viewState, setViewState] = useState<StudentCoursesViewState>(
    initialViewState ?? 'loading',
  );
  const [player, setPlayer] = useState<StudentLessonPlayerDto | null>(initialPlayer ?? null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setPlayer(null);
      setViewState('empty');
      return;
    }

    const result = await StudentApi.getLessonPlayer(primaryOrganizationId, courseId, lessonId);
    setPlayer(result);
    setViewState(result ? 'populated' : 'empty');
  }, [courseId, lessonId, primaryOrganizationId]);

  useEffect(() => {
    if (initialViewState !== undefined) {
      return;
    }

    const controller = new AbortController();
    setViewState('loading');
    setCompleteError(null);
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

  const handleComplete = async (): Promise<void> => {
    if (!primaryOrganizationId || !player || completing) {
      return;
    }
    if (player.lesson.progressStatus === 'completed') {
      return;
    }

    const previous = player;
    const optimistic = applyOptimisticLessonComplete(player);
    setPlayer(optimistic);
    setCompleting(true);
    setCompleteError(null);

    try {
      await StudentApi.markLessonComplete({
        organizationId: primaryOrganizationId,
        lessonId: player.lesson.id,
      });
      await load();
    } catch {
      setPlayer(previous);
      setCompleteError(studentLessonPlayerCopy.completeError);
    } finally {
      setCompleting(false);
    }
  };

  if (viewState === 'loading') {
    return <LessonPlayerSkeleton />;
  }

  if (viewState === 'error') {
    return (
      <TeacherModuleErrorState
        title={studentLessonPlayerCopy.errorTitle}
        description={studentLessonPlayerCopy.errorDescription}
        retryLabel={studentLessonPlayerCopy.retryLabel}
        onRetry={() => {
          setReloadKey((current) => current + 1);
        }}
      />
    );
  }

  if (viewState === 'empty' || !player) {
    return (
      <div className="space-y-4">
        <TeacherModuleEmptyState
          title={studentLessonPlayerCopy.emptyTitle}
          description={studentLessonPlayerCopy.emptyDescription}
          icon="book"
        />
        <div className="flex justify-center">
          <Button variant="primary" asChild>
            <Link href={DASHBOARD_ROUTES.learning}>
              {studentLessonPlayerCopy.breadcrumbLearning}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const previousHref = player.lesson.navigation.previousLessonId
    ? getLessonPath(courseId, player.lesson.navigation.previousLessonId)
    : null;
  const nextHref = player.lesson.navigation.nextLessonId
    ? getLessonPath(courseId, player.lesson.navigation.nextLessonId)
    : null;
  const isCompleted = player.lesson.progressStatus === 'completed';
  const notesAvailable = player.capabilities.lessonNotes === 'available';
  const resourcesAvailable = player.capabilities.lessonResources === 'available';

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-caption text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link
              href={DASHBOARD_ROUTES.learning}
              className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {studentLessonPlayerCopy.breadcrumbLearning}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={getCourseDetailsPath(courseId)}
              className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {player.course.title}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{player.lesson.title}</li>
        </ol>
      </nav>

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {player.lesson.title}
        </h1>
        <p className="text-caption text-muted-foreground">
          {statusLabel(player.lesson.progressStatus)} · {player.lesson.progressPercent}%
        </p>
        <div className="max-w-md">
          <ProgressBar
            value={player.lesson.progressPercent}
            label={studentLessonPlayerCopy.progressLabel}
          />
        </div>
      </header>

      <div className="laptop:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={outlineOpen}
          aria-controls={outlineId}
          onClick={() => {
            setOutlineOpen((open) => !open);
          }}
        >
          {studentLessonPlayerCopy.sidebarToggle}
        </Button>
        {outlineOpen ? (
          <div id={outlineId} className="mt-3">
            <StudentLessonSidebar player={player} courseId={courseId} />
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_16rem] laptop:items-start">
        <div className="min-w-0 space-y-6">
          <StudentLessonContent player={player} />

          <section className="space-y-2" aria-label={studentLessonPlayerCopy.notesLabel}>
            <h2 className="text-sm font-semibold text-foreground">
              {studentLessonPlayerCopy.notesLabel}
            </h2>
            <p className="text-small text-muted-foreground">
              {notesAvailable ? 'Notes' : studentLessonPlayerCopy.notesUnavailable}
            </p>
          </section>

          <section className="space-y-2" aria-label={studentLessonPlayerCopy.resourcesLabel}>
            <h2 className="text-sm font-semibold text-foreground">
              {studentLessonPlayerCopy.resourcesLabel}
            </h2>
            <p className="text-small text-muted-foreground">
              {resourcesAvailable ? 'Resources' : studentLessonPlayerCopy.resourcesUnavailable}
            </p>
          </section>

          {completeError ? (
            <p className="text-small text-destructive" role="alert">
              {completeError}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="flex flex-col gap-2 tablet:flex-row">
              {previousHref ? (
                <Button variant="outline" asChild>
                  <Link href={previousHref}>{studentLessonPlayerCopy.previousLabel}</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {studentLessonPlayerCopy.previousLabel}
                </Button>
              )}
              {nextHref ? (
                <Button variant="outline" asChild>
                  <Link href={nextHref}>{studentLessonPlayerCopy.nextLabel}</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {studentLessonPlayerCopy.nextLabel}
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={isCompleted || completing}
              onClick={() => {
                void handleComplete();
              }}
            >
              {completing
                ? studentLessonPlayerCopy.completingLabel
                : isCompleted
                  ? studentLessonPlayerCopy.completedLabel
                  : studentLessonPlayerCopy.completeLabel}
            </Button>
          </div>
        </div>

        <div className="hidden laptop:block">
          <div className="laptop:sticky laptop:top-20">
            <StudentLessonSidebar player={player} courseId={courseId} />
          </div>
        </div>
      </div>
    </div>
  );
}
