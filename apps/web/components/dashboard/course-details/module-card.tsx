'use client';

import { cn } from '@graphology/utils';
import { icons } from '../../../lib/constants';
import type { CourseModuleDto } from '../../../lib/dashboard';
import { LessonItem } from './lesson-item';

const ChevronIcon = icons.chevronDown;

export function ModuleCard({
  module,
  courseSlug,
  expanded,
  onToggle,
}: {
  module: CourseModuleDto;
  courseSlug: string;
  expanded: boolean;
  onToggle: () => void;
}): React.JSX.Element {
  const panelId = `${module.id}-panel`;
  const buttonId = `${module.id}-button`;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <h4>
        <button
          type="button"
          id={buttonId}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onToggle}
        >
          <span className="space-y-1">
            <span className="block text-caption text-muted-foreground">Module {module.number}</span>
            <span className="block text-sm font-semibold text-foreground">{module.title}</span>
            <span className="block text-small text-muted-foreground">{module.description}</span>
          </span>
          <ChevronIcon
            className={cn(
              'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
      </h4>
      {expanded ? (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="border-t border-border px-4 py-4">
          <ul className="space-y-2">
            {module.lessons.map((lesson) => (
              <LessonItem key={lesson.id} lesson={lesson} courseSlug={courseSlug} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
