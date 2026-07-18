'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import type { StudentCourseCardDto } from '../../../lib/student';
import { StudentCourseCard } from './student-course-card';
import { StudentCourseFilters } from './student-course-filters';
import { StudentCourseSearch } from './student-course-search';
import { StudentCoursesHeader } from './student-courses-header';
import { StudentCoursesSkeleton } from './student-courses-skeleton';
import {
  StudentCoursesEmptyState,
  StudentCoursesErrorState,
  StudentCoursesPagination,
} from './student-courses-states';
import {
  toEnrollmentApiStatus,
  toEnrollmentListSort,
  type StudentCourseSortOption,
  type StudentCoursesViewState,
  type StudentEnrollmentStatusFilter,
} from './learning-helpers';

const LIST_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 300;

export function MyCoursesView({
  initialCourses,
  initialViewState,
  initialMeta,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialCourses?: StudentCourseCardDto[];
  initialViewState?: StudentCoursesViewState;
  initialMeta?: { total: number; page: number; limit: number; totalPages: number };
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<StudentEnrollmentStatusFilter>('all');
  const [sort, setSort] = useState<StudentCourseSortOption>('recent');
  const [page, setPage] = useState(1);

  const [viewState, setViewState] = useState<StudentCoursesViewState>(
    initialViewState ?? 'loading',
  );
  const [courses, setCourses] = useState<StudentCourseCardDto[]>(initialCourses ?? []);
  const [meta, setMeta] = useState(
    initialMeta ?? { total: 0, page: 1, limit: LIST_LIMIT, totalPages: 0 },
  );
  const [reloadKey, setReloadKey] = useState(0);
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
    setPage(1);
  }, [debouncedQuery, status, sort]);

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      if (!primaryOrganizationId) {
        setCourses([]);
        setMeta({ total: 0, page: 1, limit: LIST_LIMIT, totalPages: 0 });
        setViewState('empty');
        return;
      }

      const { sortBy, sortOrder } = toEnrollmentListSort(sort);
      const result = await StudentApi.getCourses({
        organizationId: primaryOrganizationId,
        search: debouncedQuery || undefined,
        status: toEnrollmentApiStatus(status),
        page,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      setCourses(result.items);
      setMeta(result.meta);

      const filtersActive = debouncedQuery.trim().length > 0 || status !== 'all';
      if (result.items.length === 0 && !filtersActive && result.meta.total === 0) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [debouncedQuery, page, primaryOrganizationId, sort, status],
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
  }, [initialCourses, initialViewState, loadList, reloadKey]);

  const handleRetry = (): void => {
    hasLoadedRef.current = false;
    setReloadKey((current) => current + 1);
  };

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <StudentCoursesHeader />
        <StudentCoursesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <StudentCoursesHeader />
        <StudentCoursesErrorState onRetry={handleRetry} />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <StudentCoursesHeader />
        <StudentCoursesEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentCoursesHeader />

      <section className="space-y-4" aria-label="Course filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <StudentCourseSearch value={query} onChange={setQuery} />
          </div>
          <StudentCourseFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
        </div>
      </section>

      {courses.length === 0 ? (
        <StudentCoursesEmptyState variant="no-matches" />
      ) : (
        <div className="space-y-6">
          <ul
            className="grid list-none gap-4 p-0 tablet:grid-cols-2 laptop:grid-cols-3"
            aria-label="Enrolled courses"
          >
            {courses.map((course) => (
              <li key={course.enrollmentId}>
                <StudentCourseCard course={course} />
              </li>
            ))}
          </ul>
          <StudentCoursesPagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            onPrevious={() => {
              setPage((current) => Math.max(1, current - 1));
            }}
            onNext={() => {
              setPage((current) => current + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
