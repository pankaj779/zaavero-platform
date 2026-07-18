'use client';

import { ProgressBar } from '@graphology/ui';
import Link from 'next/link';
import { getLessonPath } from '../../../lib/constants';
import type { StudentLessonPlayerDto } from '../../../lib/student';
import { studentLessonPlayerCopy } from './copy';

function statusLabel(status: 'not_started' | 'in_progress' | 'completed'): string {
  if (status === 'completed') {
    return studentLessonPlayerCopy.statusCompleted;
  }
  if (status === 'in_progress') {
    return studentLessonPlayerCopy.statusInProgress;
  }
  return studentLessonPlayerCopy.statusNotStarted;
}

export function StudentLessonSidebar({
  player,
  courseId,
}: {
  player: StudentLessonPlayerDto;
  courseId: string;
}): React.JSX.Element {
  return (
    <nav
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-label={studentLessonPlayerCopy.curriculumLabel}
    >
      <p className="mb-3 text-sm font-semibold text-foreground">
        {studentLessonPlayerCopy.curriculumLabel}
      </p>
      <div className="mb-4 space-y-2">
        <ProgressBar
          value={player.course.progress.percentage}
          label={studentLessonPlayerCopy.courseProgressLabel}
        />
      </div>
      <ul className="space-y-4 p-0">
        {player.curriculum.map((module, moduleIndex) => (
          <li key={module.id} className="space-y-2">
            <p className="text-caption font-medium text-muted-foreground">
              {module.title === 'Module' ? `Module ${String(moduleIndex + 1)}` : module.title}
            </p>
            <ul className="space-y-1 border-l border-border pl-3">
              {module.lessons.map((lesson) => {
                const isCurrent = lesson.id === player.lesson.id;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={getLessonPath(courseId, lesson.id)}
                      className={`block rounded-md px-2 py-1.5 text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isCurrent
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      <span className="block truncate">{lesson.title}</span>
                      <span className="block text-caption">
                        {statusLabel(lesson.progressStatus)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
