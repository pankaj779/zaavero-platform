'use client';

import { useMemo, useState } from 'react';
import type { CourseModuleDto } from '../../../lib/dashboard';
import { ModuleCard } from './module-card';

export function CurriculumAccordion({
  modules,
  courseSlug,
}: {
  modules: CourseModuleDto[];
  courseSlug: string;
}): React.JSX.Element {
  const initialExpanded = useMemo(() => {
    const defaults = modules.filter((module) => module.defaultExpanded).map((module) => module.id);
    return new Set(defaults.length > 0 ? defaults : modules[0] ? [modules[0].id] : []);
  }, [modules]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(initialExpanded);

  return (
    <div className="space-y-3" aria-label="Course curriculum">
      {modules.map((module) => {
        const expanded = expandedIds.has(module.id);
        return (
          <ModuleCard
            key={module.id}
            module={module}
            courseSlug={courseSlug}
            expanded={expanded}
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
        );
      })}
    </div>
  );
}
