'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EnrollmentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  sortTeacherStudents,
  toEnrollmentApiStatus,
  toEnrollmentListSort,
  type TeacherStudentSortOption,
  type TeacherStudentStatusFilter,
  type TeacherStudentSummaryDto,
  type TeacherStudentsViewMode,
  type TeacherStudentsViewState,
} from '../../../lib/teacher';
import { StudentCollection } from './student-collection';
import { StudentFilters } from './student-filters';
import { StudentSearch } from './student-search';
import { StudentStats } from './student-stats';
import { StudentViewToggle } from './student-view-toggle';
import { StudentsEmptyState } from './students-empty-state';
import { StudentsErrorState } from './students-error-state';
import { StudentsHeader } from './students-header';
import { StudentsSkeleton } from './students-skeleton';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function StudentsView({
  initialStudents,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialStudents?: TeacherStudentSummaryDto[];
  initialViewState?: TeacherStudentsViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<TeacherStudentStatusFilter>('all');
  const [sort, setSort] = useState<TeacherStudentSortOption>('name');
  const [mode, setMode] = useState<TeacherStudentsViewMode>('grid');

  const [viewState, setViewState] = useState<TeacherStudentsViewState>(
    initialViewState ?? 'loading',
  );
  const [students, setStudents] = useState<TeacherStudentSummaryDto[]>(initialStudents ?? []);
  const [statsStudents, setStatsStudents] = useState<TeacherStudentSummaryDto[]>(
    initialStudents ?? [],
  );
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
      const result = await EnrollmentApi.getEnrollments({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'enrolledAt',
        sortOrder: 'desc',
        enrichLookups: false,
      });
      if (signal.aborted) {
        return;
      }
      setStatsStudents(result.items);
    },
    [primaryOrganizationId],
  );

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { sortBy, sortOrder } = toEnrollmentListSort(sort);
      const result = await EnrollmentApi.getEnrollments({
        organizationId: primaryOrganizationId ?? undefined,
        search: debouncedQuery || undefined,
        status: toEnrollmentApiStatus(status),
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      // Name/progress are not Enrollment API sort fields — finalize client-side.
      setStudents(sortTeacherStudents(result.items, sort));

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
    if (initialViewState !== undefined && initialStudents !== undefined) {
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
  }, [initialStudents, initialViewState, loadList, loadStats]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <StudentsHeader />
        <StudentsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <StudentsHeader />
        <StudentsErrorState />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <StudentsHeader />
        <StudentsEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentsHeader />

      <StudentStats students={statsStudents} />

      <section className="space-y-4" aria-label="Student filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <StudentSearch value={query} onChange={setQuery} />
          </div>
          <StudentFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
          <div className="flex justify-end laptop:ml-auto">
            <StudentViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {students.length === 0 ? (
        <StudentsEmptyState variant="no-matches" />
      ) : (
        <StudentCollection students={students} mode={mode} />
      )}
    </div>
  );
}
