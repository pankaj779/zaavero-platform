'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherLiveClasses,
  getTeacherLiveClassById,
  sortTeacherLiveClasses,
  type TeacherLiveClassDto,
  type TeacherLiveClassProviderFilter,
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

/** Client boundary containing live-class discovery and selection state. */
export function LiveClassesWorkspace({
  sessions,
  query: controlledQuery,
  status: controlledStatus,
  sort: controlledSort,
  courseId: controlledCourseId,
  batchId: controlledBatchId,
  provider: controlledProvider,
  courseOptions = [{ value: 'all', label: 'All Courses' }],
  batchOptions = [{ value: 'all', label: 'All Batches' }],
  onQueryChange,
  onStatusChange,
  onSortChange,
  onCourseChange,
  onBatchChange,
  onProviderChange,
  serverFiltered = false,
  onSessionChanged,
}: {
  sessions: TeacherLiveClassDto[];
  query?: string;
  status?: TeacherLiveClassStatusFilter;
  sort?: TeacherLiveClassSortOption;
  courseId?: string;
  batchId?: string;
  provider?: TeacherLiveClassProviderFilter;
  courseOptions?: readonly { value: string; label: string }[];
  batchOptions?: readonly { value: string; label: string }[];
  onQueryChange?: (value: string) => void;
  onStatusChange?: (value: TeacherLiveClassStatusFilter) => void;
  onSortChange?: (value: TeacherLiveClassSortOption) => void;
  onCourseChange?: (value: string) => void;
  onBatchChange?: (value: string) => void;
  onProviderChange?: (value: TeacherLiveClassProviderFilter) => void;
  /** When true, parent already applied server-side filters — skip local filter/sort. */
  serverFiltered?: boolean;
  onSessionChanged?: () => void;
}): React.JSX.Element {
  const [localQuery, setLocalQuery] = useState('');
  const [localStatus, setLocalStatus] = useState<TeacherLiveClassStatusFilter>('all');
  const [localSort, setLocalSort] = useState<TeacherLiveClassSortOption>('upcoming');
  const [localCourseId, setLocalCourseId] = useState('all');
  const [localBatchId, setLocalBatchId] = useState('all');
  const [localProvider, setLocalProvider] = useState<TeacherLiveClassProviderFilter>('all');
  const [mode, setMode] = useState<TeacherLiveClassesViewMode>('grid');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const query = controlledQuery ?? localQuery;
  const status = controlledStatus ?? localStatus;
  const sort = controlledSort ?? localSort;
  const courseId = controlledCourseId ?? localCourseId;
  const batchId = controlledBatchId ?? localBatchId;
  const provider = controlledProvider ?? localProvider;

  const visibleSessions = useMemo(() => {
    if (serverFiltered) {
      return sessions;
    }
    const filtered = filterTeacherLiveClasses(sessions, query, status, {
      courseId,
      batchId,
      provider,
    });
    return sortTeacherLiveClasses(filtered, sort);
  }, [batchId, courseId, provider, query, serverFiltered, sessions, sort, status]);

  const selectedSession = useMemo(
    () =>
      selectedSessionId === null ? null : getTeacherLiveClassById(sessions, selectedSessionId),
    [sessions, selectedSessionId],
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4" aria-label="Live class filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <LiveClassSearch
              value={query}
              onChange={(value) => {
                onQueryChange?.(value);
                if (!onQueryChange) {
                  setLocalQuery(value);
                }
              }}
            />
          </div>
          <LiveClassFilters
            status={status}
            sort={sort}
            courseId={courseId}
            batchId={batchId}
            provider={provider}
            courseOptions={courseOptions}
            batchOptions={batchOptions}
            onStatusChange={(value) => {
              onStatusChange?.(value);
              if (!onStatusChange) {
                setLocalStatus(value);
              }
            }}
            onSortChange={(value) => {
              onSortChange?.(value);
              if (!onSortChange) {
                setLocalSort(value);
              }
            }}
            onCourseChange={(value) => {
              onCourseChange?.(value);
              if (!onCourseChange) {
                setLocalCourseId(value);
              }
            }}
            onBatchChange={(value) => {
              onBatchChange?.(value);
              if (!onBatchChange) {
                setLocalBatchId(value);
              }
            }}
            onProviderChange={(value) => {
              onProviderChange?.(value);
              if (!onProviderChange) {
                setLocalProvider(value);
              }
            }}
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
          onChanged={onSessionChanged}
        />
      )}
    </div>
  );
}
