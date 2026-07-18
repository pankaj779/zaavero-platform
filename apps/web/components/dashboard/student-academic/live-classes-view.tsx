'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import type { StudentLiveClassDto } from '../../../lib/student';
import { studentLivePageCopy } from './copy';
import {
  deriveStudentLiveStats,
  filterStudentLiveClasses,
  requireOrganizationId,
  sortStudentLiveClasses,
  toLiveSessionApiStatus,
  type StudentLiveScheduleFilter,
  type StudentLiveSortOption,
  type StudentLiveStatusFilter,
  type StudentViewState,
} from './filters';
import {
  StudentLiveCollection,
  StudentLiveDetails,
  StudentLiveFilters,
  StudentLiveStats,
} from './live-parts';
import {
  StudentModuleErrorState,
  StudentModuleHeader,
  StudentModuleSkeleton,
  StudentPaginationBar,
  StudentModuleEmptyState,
} from './shared';

const LIST_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function StudentLiveClassesView({
  initialSessions,
  initialViewState,
  initialMeta,
}: {
  initialSessions?: StudentLiveClassDto[];
  initialViewState?: StudentViewState;
  initialMeta?: { total: number; page: number; limit: number; totalPages: number };
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const copy = studentLivePageCopy;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<StudentLiveStatusFilter>('all');
  const [schedule, setSchedule] = useState<StudentLiveScheduleFilter>('all');
  const [sort, setSort] = useState<StudentLiveSortOption>('upcoming');
  const [courseId, setCourseId] = useState('all');
  const [batchId, setBatchId] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [viewState, setViewState] = useState<StudentViewState>(initialViewState ?? 'loading');
  const [sessions, setSessions] = useState<StudentLiveClassDto[]>(initialSessions ?? []);
  const [statsSessions, setStatsSessions] = useState<StudentLiveClassDto[]>(initialSessions ?? []);
  const [meta, setMeta] = useState(
    initialMeta ?? { total: 0, page: 1, limit: LIST_LIMIT, totalPages: 0 },
  );
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Courses' },
  ]);
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Batches' },
  ]);
  const hasLoadedRef = useRef(initialViewState !== undefined);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const organizationId = requireOrganizationId(primaryOrganizationId);
      const sortBy =
        sort === 'alphabetical' ? 'title' : sort === 'recently_updated' ? 'updatedAt' : 'startsAt';
      const sortOrder = sort === 'upcoming' ? 'asc' : 'desc';

      const [listResult, statsResult] = await Promise.all([
        StudentApi.getLiveClasses({
          organizationId,
          search: debouncedQuery || undefined,
          status: toLiveSessionApiStatus(status),
          batchId: batchId === 'all' ? undefined : batchId,
          page,
          limit: LIST_LIMIT,
          sortBy,
          sortOrder,
        }),
        StudentApi.getLiveClasses({
          organizationId,
          page: 1,
          limit: 100,
          sortBy: 'startsAt',
          sortOrder: 'asc',
        }),
      ]);

      if (signal.aborted) {
        return;
      }

      setSessions(listResult.items);
      setMeta(listResult.meta);
      setStatsSessions(statsResult.items);

      const courses = new Map<string, string>();
      const batches = new Map<string, string>();
      for (const session of statsResult.items) {
        if (session.course.id) {
          courses.set(session.course.id, session.course.title);
        }
        batches.set(session.batch.id, session.batch.name);
      }
      setCourseOptions([
        { value: 'all', label: 'All Courses' },
        ...[...courses.entries()].map(([value, label]) => ({ value, label })),
      ]);
      setBatchOptions([
        { value: 'all', label: 'All Batches' },
        ...[...batches.entries()].map(([value, label]) => ({ value, label })),
      ]);

      const filtersActive =
        debouncedQuery.trim().length > 0 ||
        status !== 'all' ||
        schedule !== 'all' ||
        courseId !== 'all' ||
        batchId !== 'all';

      if (listResult.items.length === 0 && !filtersActive && listResult.meta.total === 0) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [batchId, courseId, debouncedQuery, page, primaryOrganizationId, schedule, sort, status],
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
        await loadList(controller.signal);
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
  }, [initialSessions, initialViewState, loadList, reloadKey]);

  const visibleSessions = useMemo(() => {
    const filtered = filterStudentLiveClasses(sessions, debouncedQuery, status, schedule, {
      courseId,
      batchId,
    });
    return sortStudentLiveClasses(filtered, sort);
  }, [batchId, courseId, debouncedQuery, schedule, sessions, sort, status]);

  const selectedSession =
    selectedId === null
      ? null
      : (visibleSessions.find((session) => session.id === selectedId) ?? null);

  const stats = useMemo(() => deriveStudentLiveStats(statsSessions), [statsSessions]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleSkeleton label="Loading Live Classes" />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleErrorState
          title={copy.errorTitle}
          description={copy.errorDescription}
          onRetry={() => {
            setReloadKey((value) => value + 1);
          }}
        />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleEmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentModuleHeader title={copy.title} description={copy.description} />
      <StudentLiveStats stats={stats} />
      <StudentLiveFilters
        query={query}
        status={status}
        schedule={schedule}
        sort={sort}
        courseId={courseId}
        batchId={batchId}
        courseOptions={courseOptions}
        batchOptions={batchOptions}
        onQueryChange={setQuery}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onScheduleChange={(value) => {
          setSchedule(value);
          setPage(1);
        }}
        onSortChange={(value) => {
          setSort(value);
          setPage(1);
        }}
        onCourseChange={(value) => {
          setCourseId(value);
          setPage(1);
        }}
        onBatchChange={(value) => {
          setBatchId(value);
          setPage(1);
        }}
      />
      {selectedSession ? (
        <StudentLiveDetails
          session={selectedSession}
          onClose={() => {
            setSelectedId(null);
          }}
        />
      ) : null}
      <StudentLiveCollection
        sessions={visibleSessions}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <StudentPaginationBar
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        label={copy.paginationLabel}
        onPageChange={setPage}
      />
    </div>
  );
}
