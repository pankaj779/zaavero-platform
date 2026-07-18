'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttendanceApi, BatchApi, CourseApi, LiveSessionApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  filterAttendanceSessions,
  getAttendanceSessionById,
  sortAttendanceSessions,
  toAttendanceListSort,
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

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function AttendanceView({
  initialSessions,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialSessions?: AttendanceSessionDto[];
  initialViewState?: TeacherAttendanceViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<AttendanceStatusFilter>('all');
  const [sort, setSort] = useState<AttendanceSortOption>('session_date');
  const [courseId, setCourseId] = useState('all');
  const [batchId, setBatchId] = useState('all');
  const [liveSessionId, setLiveSessionId] = useState('all');
  const [mode, setMode] = useState<TeacherAttendanceViewMode>('grid');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Courses' },
  ]);
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Batches' },
  ]);
  const [liveSessionOptions, setLiveSessionOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Live Sessions' },
  ]);
  const [allBatches, setAllBatches] = useState<
    { value: string; label: string; courseId: string }[]
  >([]);

  const [viewState, setViewState] = useState<TeacherAttendanceViewState>(
    initialViewState ?? 'loading',
  );
  const [sessions, setSessions] = useState<AttendanceSessionDto[]>(initialSessions ?? []);
  const [statsSessions, setStatsSessions] = useState<AttendanceSessionDto[]>(initialSessions ?? []);
  const hasLoadedRef = useRef(initialViewState !== undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (initialViewState !== undefined && initialSessions !== undefined) {
      return;
    }

    void (async () => {
      try {
        const [courses, batches, liveSessions] = await Promise.all([
          CourseApi.getCourses({
            organizationId: primaryOrganizationId ?? undefined,
            page: 1,
            limit: LIST_LIMIT,
            sortBy: 'title',
            sortOrder: 'asc',
          }),
          BatchApi.getBatches({
            organizationId: primaryOrganizationId ?? undefined,
            page: 1,
            limit: LIST_LIMIT,
            sortBy: 'name',
            sortOrder: 'asc',
            enrichCourses: true,
          }),
          LiveSessionApi.getLiveSessions({
            organizationId: primaryOrganizationId ?? undefined,
            page: 1,
            limit: LIST_LIMIT,
            sortBy: 'startsAt',
            sortOrder: 'desc',
            enrichLookups: true,
          }),
        ]);

        setCourseOptions([
          { value: 'all', label: 'All Courses' },
          ...courses.items.map((course) => ({ value: course.id, label: course.title })),
        ]);

        const mappedBatches = batches.items.map((batch) => ({
          value: batch.id,
          label: batch.name,
          courseId: batch.course.id,
        }));
        setAllBatches(mappedBatches);
        setBatchOptions([
          { value: 'all', label: 'All Batches' },
          ...mappedBatches.map(({ value, label }) => ({ value, label })),
        ]);

        setLiveSessionOptions([
          { value: 'all', label: 'All Live Sessions' },
          ...liveSessions.items.map((session) => ({
            value: session.id,
            label: session.title,
          })),
        ]);
      } catch {
        setCourseOptions([{ value: 'all', label: 'All Courses' }]);
        setBatchOptions([{ value: 'all', label: 'All Batches' }]);
        setLiveSessionOptions([{ value: 'all', label: 'All Live Sessions' }]);
      }
    })();
  }, [initialSessions, initialViewState, primaryOrganizationId]);

  useEffect(() => {
    if (courseId === 'all') {
      setBatchOptions([
        { value: 'all', label: 'All Batches' },
        ...allBatches.map(({ value, label }) => ({ value, label })),
      ]);
      return;
    }

    const filtered = allBatches.filter((batch) => batch.courseId === courseId);
    setBatchOptions([
      { value: 'all', label: 'All Batches' },
      ...filtered.map(({ value, label }) => ({ value, label })),
    ]);
    if (batchId !== 'all' && !filtered.some((batch) => batch.value === batchId)) {
      setBatchId('all');
    }
  }, [allBatches, batchId, courseId]);

  const loadStats = useCallback(
    async (signal: AbortSignal) => {
      const result = await AttendanceApi.getAttendances({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'markedAt',
        sortOrder: 'desc',
      });
      if (signal.aborted) {
        return;
      }
      setStatsSessions(result.items);
    },
    [primaryOrganizationId],
  );

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { sortBy, sortOrder } = toAttendanceListSort(sort);

      // Server supports liveSessionId; course/batch/search/session-status are client-side.
      const result = await AttendanceApi.getAttendances({
        organizationId: primaryOrganizationId ?? undefined,
        liveSessionId: liveSessionId === 'all' ? undefined : liveSessionId,
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      const filtered = filterAttendanceSessions(result.items, debouncedQuery, status, {
        courseId,
        batchId,
        liveSessionId,
      });
      const sorted = sortAttendanceSessions(filtered, sort);

      setSessions(sorted);

      const filtersActive =
        debouncedQuery.trim().length > 0 ||
        status !== 'all' ||
        courseId !== 'all' ||
        batchId !== 'all' ||
        liveSessionId !== 'all';
      if (sorted.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [batchId, courseId, debouncedQuery, liveSessionId, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialSessions !== undefined) {
      return;
    }

    const controller = new AbortController();
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setViewState('loading');
    }

    void (async () => {
      try {
        if (isFirstLoad) {
          await Promise.all([loadStats(controller.signal), loadList(controller.signal)]);
        } else {
          await loadList(controller.signal);
        }
        hasLoadedRef.current = true;
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialSessions, initialViewState, loadList, loadStats]);

  const selectedSession = useMemo(
    () =>
      selectedSessionId === null ? null : getAttendanceSessionById(sessions, selectedSessionId),
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

  if (viewState === 'empty') {
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

      <AttendanceStats sessions={statsSessions} />

      <section className="space-y-4" aria-label="Attendance filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <AttendanceSearch value={query} onChange={setQuery} />
          </div>
          <AttendanceFilters
            status={status}
            sort={sort}
            courseId={courseId}
            batchId={batchId}
            liveSessionId={liveSessionId}
            courseOptions={courseOptions}
            batchOptions={batchOptions}
            liveSessionOptions={liveSessionOptions}
            onStatusChange={setStatus}
            onSortChange={setSort}
            onCourseChange={setCourseId}
            onBatchChange={setBatchId}
            onLiveSessionChange={setLiveSessionId}
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

      {sessions.length === 0 ? (
        <AttendanceEmptyState variant="no-matches" />
      ) : (
        <SessionCollection
          sessions={sessions}
          mode={mode}
          selectedSessionId={selectedSessionId}
          onSelect={setSelectedSessionId}
        />
      )}
    </div>
  );
}
