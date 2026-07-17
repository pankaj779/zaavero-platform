'use client';

import { useMemo, useState } from 'react';
import {
  attendanceSessions,
  filterAttendanceSessions,
  getAttendanceSessionById,
  sortAttendanceSessions,
  teacherAttendanceViewState,
  type AttendanceSessionDto,
  type AttendanceSortOption,
  type AttendanceStatusFilter,
  type TeacherAttendanceViewMode,
  type TeacherAttendanceViewState,
} from '../../../lib/teacher';
import { AttendanceEmptyState } from './attendance-empty-state';
import { AttendanceErrorState } from './attendance-error-state';
import { AttendanceFilters } from './attendance-filters';
import { AttendanceHeader } from './attendance-header';
import { AttendanceSearch } from './attendance-search';
import { AttendanceSkeleton } from './attendance-skeleton';
import { AttendanceStats } from './attendance-stats';
import { AttendanceViewToggle } from './attendance-view-toggle';
import { SessionCollection } from './session-collection';
import { SessionDetailsPanel } from './session-details-panel';

export function AttendanceView({
  sessions = attendanceSessions,
  viewState = teacherAttendanceViewState,
}: {
  sessions?: AttendanceSessionDto[];
  viewState?: TeacherAttendanceViewState;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AttendanceStatusFilter>('all');
  const [sort, setSort] = useState<AttendanceSortOption>('session_date');
  const [mode, setMode] = useState<TeacherAttendanceViewMode>('grid');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const visibleSessions = useMemo(() => {
    const filtered = filterAttendanceSessions(sessions, query, status);
    return sortAttendanceSessions(filtered, sort);
  }, [sessions, query, sort, status]);

  const selectedSession = useMemo(
    () => (selectedSessionId === null ? null : getAttendanceSessionById(sessions, selectedSessionId)),
    [sessions, selectedSessionId],
  );

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <AttendanceHeader />
        <AttendanceSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <AttendanceHeader />
        <AttendanceErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || sessions.length === 0) {
    return (
      <div className="space-y-8">
        <AttendanceHeader />
        <AttendanceEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AttendanceHeader />

      <AttendanceStats sessions={sessions} />

      <section className="space-y-4" aria-label="Attendance filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <AttendanceSearch value={query} onChange={setQuery} />
          </div>
          <AttendanceFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
          <div className="flex justify-end laptop:ml-auto">
            <AttendanceViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {selectedSession ? (
        <SessionDetailsPanel
          session={selectedSession}
          onClose={() => {
            setSelectedSessionId(null);
          }}
        />
      ) : null}

      {visibleSessions.length === 0 ? (
        <AttendanceEmptyState variant="no-matches" />
      ) : (
        <SessionCollection
          sessions={visibleSessions}
          mode={mode}
          selectedSessionId={selectedSessionId}
          onSelect={setSelectedSessionId}
        />
      )}
    </div>
  );
}
