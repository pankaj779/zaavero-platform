'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherLiveClasses,
  getTeacherLiveClassById,
  sortTeacherLiveClasses,
  type TeacherLiveClassDto,
  type TeacherLiveClassSortOption,
  type TeacherLiveClassStatusFilter,
  type TeacherLiveClassesViewMode,
} from '../../../lib/teacher';
import { LiveClassCollection } from './live-class-collection';
import { LiveClassDetailsPanel } from './live-class-details-panel';
import { LiveClassFilters } from './live-class-filters';
import { LiveClassSearch } from './live-class-search';
import { LiveClassViewToggle } from './live-class-view-toggle';
import { LiveClassesEmptyState } from './live-classes-empty-state';

/** Client boundary containing only live-class discovery and selection state. */
export function LiveClassesWorkspace({
  sessions,
}: {
  sessions: TeacherLiveClassDto[];
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TeacherLiveClassStatusFilter>('all');
  const [sort, setSort] = useState<TeacherLiveClassSortOption>('upcoming');
  const [mode, setMode] = useState<TeacherLiveClassesViewMode>('grid');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const visibleSessions = useMemo(() => {
    const filtered = filterTeacherLiveClasses(sessions, query, status);
    return sortTeacherLiveClasses(filtered, sort);
  }, [sessions, query, sort, status]);

  const selectedSession = useMemo(
    () =>
      selectedSessionId === null
        ? null
        : getTeacherLiveClassById(sessions, selectedSessionId),
    [sessions, selectedSessionId],
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4" aria-label="Live class filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <LiveClassSearch value={query} onChange={setQuery} />
          </div>
          <LiveClassFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
          <div className="flex justify-end laptop:ml-auto">
            <LiveClassViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {selectedSession ? (
        <LiveClassDetailsPanel
          session={selectedSession}
          onClose={() => {
            setSelectedSessionId(null);
          }}
        />
      ) : null}

      {visibleSessions.length === 0 ? (
        <LiveClassesEmptyState variant="no-matches" />
      ) : (
        <LiveClassCollection
          sessions={visibleSessions}
          mode={mode}
          selectedSessionId={selectedSessionId}
          onSelect={setSelectedSessionId}
        />
      )}
    </div>
  );
}
