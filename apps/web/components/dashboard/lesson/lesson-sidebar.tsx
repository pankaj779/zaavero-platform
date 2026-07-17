'use client';

import { cn } from '@graphology/utils';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getLessonPath, icons } from '../../../lib/constants';
import {
  lessonPlayerCopy,
  playerLessonStatusLabel,
  playerLessonTypeLabel,
  type LessonOutlineDto,
  type LessonPlayerDto,
  type ModuleOutlineDto,
} from '../../../lib/dashboard';

const ChevronIcon = icons.chevronDown;
const LockIcon = icons.lock;
const CheckIcon = icons.check;

function LessonLink({
  courseSlug,
  lesson,
  currentLessonId,
}: {
  courseSlug: string;
  lesson: LessonOutlineDto;
  currentLessonId: string;
}): React.JSX.Element {
  const isCurrent = lesson.id === currentLessonId;
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const className = cn(
    'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isCurrent && 'bg-muted font-medium text-foreground ring-1 ring-ring',
    !isCurrent && !isLocked && 'text-foreground hover:bg-muted/70',
    isLocked && 'cursor-not-allowed text-muted-foreground opacity-70',
  );

  const body = (
    <>
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
        {isLocked ? (
          <LockIcon className="h-3.5 w-3.5" />
        ) : isCompleted ? (
          <CheckIcon className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-border" />
        )}
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block truncate">{lesson.title}</span>
        <span className="block text-caption text-muted-foreground">
          {playerLessonTypeLabel[lesson.type]} · {lesson.duration.label}
          <span className="sr-only">, {playerLessonStatusLabel[lesson.status]}</span>
        </span>
      </span>
    </>
  );

  if (isLocked) {
    return (
      <span className={className} aria-disabled="true">
        {body}
      </span>
    );
  }

  return (
    <Link
      href={getLessonPath(courseSlug, lesson.id)}
      className={className}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {body}
    </Link>
  );
}

function ModuleSection({
  module,
  courseSlug,
  currentLessonId,
  expanded,
  onToggle,
}: {
  module: ModuleOutlineDto;
  courseSlug: string;
  currentLessonId: string;
  expanded: boolean;
  onToggle: () => void;
}): React.JSX.Element {
  const panelId = `lesson-sidebar-${module.id}-panel`;
  const buttonId = `lesson-sidebar-${module.id}-button`;

  return (
    <div className="border-b border-border last:border-b-0">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onToggle}
        >
          <span className="min-w-0 space-y-1">
            <span className="block text-caption text-muted-foreground">Module {module.number}</span>
            <span className="block text-sm font-semibold text-foreground">{module.title}</span>
            <span className="block text-caption text-muted-foreground">
              {module.progress.completedItems}/{module.progress.totalItems} complete
            </span>
          </span>
          <ChevronIcon
            className={cn(
              'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
      </h3>
      {expanded ? (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="space-y-1 px-2 pb-3">
          {module.lessons.map((lesson) => (
            <LessonLink
              key={lesson.id}
              courseSlug={courseSlug}
              lesson={lesson}
              currentLessonId={currentLessonId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LessonSidebar({
  data,
  className,
}: {
  data: LessonPlayerDto;
  className?: string;
}): React.JSX.Element {
  const { course, curriculum, lesson } = data;

  const initialExpanded = useMemo(() => {
    const defaults = curriculum
      .filter((moduleItem) => {
        const containsCurrentLesson = moduleItem.lessons.some((item) => item.id === lesson.id);
        return moduleItem.defaultExpanded === true ? true : containsCurrentLesson;
      })
      .map((moduleItem) => moduleItem.id);
    const fallback = curriculum[0] ? [curriculum[0].id] : [];
    return new Set(defaults.length > 0 ? defaults : fallback);
  }, [curriculum, lesson.id]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(initialExpanded);

  return (
    <aside
      className={cn('rounded-xl border border-border bg-card shadow-sm', className)}
      aria-label={lessonPlayerCopy.curriculumLabel}
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-caption text-muted-foreground">Course</p>
        <p className="text-sm font-semibold text-foreground">{course.title}</p>
      </div>
      <div>
        {curriculum.map((module) => (
          <ModuleSection
            key={module.id}
            module={module}
            courseSlug={course.slug}
            currentLessonId={lesson.id}
            expanded={expandedIds.has(module.id)}
            onToggle={() => {
              setExpandedIds((current) => {
                const next = new Set(current);
                if (next.has(module.id)) {
                  next.delete(module.id);
                } else {
                  next.add(module.id);
                }
                return next;
              });
            }}
          />
        ))}
      </div>
    </aside>
  );
}
