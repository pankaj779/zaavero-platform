'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CourseApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  toCourseApiStatus,
  toCourseListSort,
  type TeacherCourseSortOption,
  type TeacherCourseStatusFilter,
  type TeacherCourseSummaryDto,
  type TeacherCoursesViewMode,
  type TeacherCoursesViewState,
} from '../../../lib/teacher';
import { CourseCollection } from './course-collection';
import { CourseFilters } from './course-filters';
import { CourseSearch } from './course-search';
import { CourseStats } from './course-stats';
import { CourseViewToggle } from './course-view-toggle';
import { CoursesEmptyState } from './courses-empty-state';
import { CoursesErrorState } from './courses-error-state';
import { CoursesHeader } from './courses-header';
import { CoursesSkeleton } from './courses-skeleton';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function CoursesView({
  initialCourses,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialCourses?: TeacherCourseSummaryDto[];
  initialViewState?: TeacherCoursesViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<TeacherCourseStatusFilter>('all');
  const [sort, setSort] = useState<TeacherCourseSortOption>('newest');
  const [mode, setMode] = useState<TeacherCoursesViewMode>('grid');

  const [viewState, setViewState] = useState<TeacherCoursesViewState>(
    initialViewState ?? 'loading',
  );
  const [courses, setCourses] = useState<TeacherCourseSummaryDto[]>(initialCourses ?? []);
  const [statsCourses, setStatsCourses] = useState<TeacherCourseSummaryDto[]>(initialCourses ?? []);
  const hasLoadedRef = useRef(initialViewState !== undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadStats = useCallback(
    async (signal: AbortSignal) => {
      const result = await CourseApi.getCourses({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (signal.aborted) {
        return;
      }
      setStatsCourses(result.items);
    },
    [primaryOrganizationId],
  );

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { sortBy, sortOrder } = toCourseListSort(sort);
      const result = await CourseApi.getCourses({
        organizationId: primaryOrganizationId ?? undefined,
        search: debouncedQuery || undefined,
        status: toCourseApiStatus(status),
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      setCourses(result.items);

      const filtersActive = debouncedQuery.trim().length > 0 || status !== 'all';
      if (result.items.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [debouncedQuery, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialCourses !== undefined) {
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
  }, [initialCourses, initialViewState, loadList, loadStats]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <CoursesHeader />
        <CoursesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <CoursesHeader />
        <CoursesErrorState />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <CoursesHeader />
        <CoursesEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CoursesHeader />

      <CourseStats courses={statsCourses} />

      <section className="space-y-4" aria-label="Course filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <CourseSearch value={query} onChange={setQuery} />
          </div>
          <CourseFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
          <div className="flex justify-end laptop:ml-auto">
            <CourseViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {courses.length === 0 ? (
        <CoursesEmptyState variant="no-matches" />
      ) : (
        <CourseCollection
          courses={courses}
          mode={mode}
          organizationId={primaryOrganizationId ?? ''}
          onCourseUpdated={(updated) => {
            setCourses((items) => items.map((item) => (item.id === updated.id ? updated : item)));
            setStatsCourses((items) =>
              items.map((item) => (item.id === updated.id ? updated : item)),
            );
          }}
        />
      )}
    </div>
  );
}
