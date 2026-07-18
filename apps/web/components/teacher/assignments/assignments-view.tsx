'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@graphology/ui';
import { AssignmentApi, BatchApi, CourseApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  teacherAssignmentsPageCopy,
  toAssignmentApiStatus,
  toAssignmentListSort,
  type TeacherAssignmentDto,
  type TeacherAssignmentSortOption,
  type TeacherAssignmentStatusFilter,
  type TeacherAssignmentsViewState,
} from '../../../lib/teacher';
import { AssignmentStats } from './assignment-stats';
import { AssignmentsEmptyState } from './assignments-empty-state';
import { AssignmentsErrorState } from './assignments-error-state';
import { AssignmentsHeader } from './assignments-header';
import { AssignmentsSkeleton } from './assignments-skeleton';
import { AssignmentsWorkspace } from './assignments-workspace';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

function CreateAssignmentAction(): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;
  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" disabled aria-label={`${copy.createButton} — coming soon`}>
        {copy.createButton}
      </Button>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}

export function AssignmentsView({
  initialAssignments,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialAssignments?: TeacherAssignmentDto[];
  initialViewState?: TeacherAssignmentsViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<TeacherAssignmentStatusFilter>('all');
  const [sort, setSort] = useState<TeacherAssignmentSortOption>('recently_updated');
  const [courseId, setCourseId] = useState('all');
  const [batchId, setBatchId] = useState('all');
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Courses' },
  ]);
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Batches' },
  ]);
  const [allBatches, setAllBatches] = useState<
    { value: string; label: string; courseId: string }[]
  >([]);

  const [viewState, setViewState] = useState<TeacherAssignmentsViewState>(
    initialViewState ?? 'loading',
  );
  const [assignments, setAssignments] = useState<TeacherAssignmentDto[]>(initialAssignments ?? []);
  const [statsAssignments, setStatsAssignments] = useState<TeacherAssignmentDto[]>(
    initialAssignments ?? [],
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

  useEffect(() => {
    if (initialViewState !== undefined && initialAssignments !== undefined) {
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
  }, [initialAssignments, initialViewState, primaryOrganizationId]);

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
      const result = await AssignmentApi.getAssignments({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      if (signal.aborted) {
        return;
      }
      setStatsAssignments(result.items);
    },
    [primaryOrganizationId],
  );

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { sortBy, sortOrder } = toAssignmentListSort(sort);
      const result = await AssignmentApi.getAssignments({
        organizationId: primaryOrganizationId ?? undefined,
        search: debouncedQuery || undefined,
        status: toAssignmentApiStatus(status),
        courseId: courseId === 'all' ? undefined : courseId,
        batchId: batchId === 'all' ? undefined : batchId,
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      setAssignments(result.items);

      const filtersActive =
        debouncedQuery.trim().length > 0 ||
        status !== 'all' ||
        courseId !== 'all' ||
        batchId !== 'all';
      if (result.items.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [batchId, courseId, debouncedQuery, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialAssignments !== undefined) {
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
  }, [initialAssignments, initialViewState, loadList, loadStats]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <AssignmentsHeader />
        <AssignmentsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <AssignmentsHeader />
        <AssignmentsErrorState />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 laptop:flex-row laptop:items-start laptop:justify-between">
          <AssignmentsHeader />
          <CreateAssignmentAction />
        </div>
        <AssignmentsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 laptop:flex-row laptop:items-start laptop:justify-between">
        <AssignmentsHeader />
        <CreateAssignmentAction />
      </div>
      <AssignmentStats assignments={statsAssignments} />
      <AssignmentsWorkspace
        assignments={assignments}
        query={query}
        status={status}
        sort={sort}
        courseId={courseId}
        batchId={batchId}
        courseOptions={courseOptions}
        batchOptions={batchOptions}
        organizationId={primaryOrganizationId ?? ''}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onSortChange={setSort}
        onCourseChange={setCourseId}
        onBatchChange={setBatchId}
        onAssignmentUpdated={(updated) => {
          setAssignments((items) => items.map((item) => (item.id === updated.id ? updated : item)));
          setStatsAssignments((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        }}
        serverFiltered
      />
    </div>
  );
}
