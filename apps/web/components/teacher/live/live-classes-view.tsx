'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BatchApi, CourseApi, LiveSessionApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  toLiveSessionApiProvider,
  toLiveSessionApiStatus,
  toLiveSessionListSort,
  type TeacherLiveClassDto,
  type TeacherLiveClassProviderFilter,
  type TeacherLiveClassSortOption,
  type TeacherLiveClassStatusFilter,
  type TeacherLiveClassesViewState,
} from '../../../lib/teacher';
import { LiveClassStats } from './live-class-stats';
import { LiveClassesEmptyState } from './live-classes-empty-state';
import { LiveClassesErrorState } from './live-classes-error-state';
import { LiveClassesHeader } from './live-classes-header';
import { LiveClassesSkeleton } from './live-classes-skeleton';
import { LiveClassesWorkspace } from './live-classes-workspace';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function LiveClassesView({
  initialSessions,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialSessions?: TeacherLiveClassDto[];
  initialViewState?: TeacherLiveClassesViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<TeacherLiveClassStatusFilter>('all');
  const [sort, setSort] = useState<TeacherLiveClassSortOption>('upcoming');
  const [courseId, setCourseId] = useState('all');
  const [batchId, setBatchId] = useState('all');
  const [provider, setProvider] = useState<TeacherLiveClassProviderFilter>('all');
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Courses' },
  ]);
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Batches' },
  ]);
  const [allBatches, setAllBatches] = useState<
    { value: string; label: string; courseId: string }[]
  >([]);

  const [viewState, setViewState] = useState<TeacherLiveClassesViewState>(
    initialViewState ?? 'loading',
  );
  const [sessions, setSessions] = useState<TeacherLiveClassDto[]>(initialSessions ?? []);
  const [statsSessions, setStatsSessions] = useState<TeacherLiveClassDto[]>(initialSessions ?? []);
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
        const [courses, batches] = await Promise.all([
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
      } catch {
        setCourseOptions([{ value: 'all', label: 'All Courses' }]);
        setBatchOptions([{ value: 'all', label: 'All Batches' }]);
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
      const result = await LiveSessionApi.getLiveSessions({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'startsAt',
        sortOrder: 'asc',
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
      const { sortBy, sortOrder } = toLiveSessionListSort(sort);

      // API has batchId but not courseId — when only a course is selected, fetch all
      // then narrow client-side in the view after enrichment.
      const result = await LiveSessionApi.getLiveSessions({
        organizationId: primaryOrganizationId ?? undefined,
        search: debouncedQuery || undefined,
        status: toLiveSessionApiStatus(status),
        meetingProvider: toLiveSessionApiProvider(provider),
        batchId: batchId === 'all' ? undefined : batchId,
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      const filtered =
        courseId === 'all'
          ? result.items
          : result.items.filter((session) => session.course.id === courseId);

      setSessions(filtered);

      const filtersActive =
        debouncedQuery.trim().length > 0 ||
        status !== 'all' ||
        courseId !== 'all' ||
        batchId !== 'all' ||
        provider !== 'all';
      if (filtered.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [batchId, courseId, debouncedQuery, primaryOrganizationId, provider, sort, status],
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

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <LiveClassesHeader />
        <LiveClassesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <LiveClassesHeader />
        <LiveClassesErrorState />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <LiveClassesHeader />
        <LiveClassesEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LiveClassesHeader />
      <LiveClassStats sessions={statsSessions} />
      <LiveClassesWorkspace
        sessions={sessions}
        query={query}
        status={status}
        sort={sort}
        courseId={courseId}
        batchId={batchId}
        provider={provider}
        courseOptions={courseOptions}
        batchOptions={batchOptions}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onSortChange={setSort}
        onCourseChange={setCourseId}
        onBatchChange={setBatchId}
        onProviderChange={setProvider}
        serverFiltered
        onSessionChanged={() => {
          const controller = new AbortController();
          void loadList(controller.signal);
          void loadStats(controller.signal);
        }}
      />
    </div>
  );
}
