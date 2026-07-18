'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import type { StudentAssignmentDto } from '../../../lib/student';
import {
  StudentAssignmentCollection,
  StudentAssignmentDetails,
  StudentAssignmentFilters,
  StudentAssignmentStats,
} from './assignment-parts';
import { studentAssignmentsPageCopy } from './copy';
import { canEditOwnSubmission, isStudentVisibleAssignmentStatus } from './capabilities';
import {
  deriveStudentAssignmentStats,
  filterStudentAssignments,
  requireOrganizationId,
  sortStudentAssignments,
  toAssignmentApiStatus,
  type StudentAssignmentSortOption,
  type StudentAssignmentStatusFilter,
  type StudentViewState,
} from './filters';
import {
  assertNoGradingFields,
  buildCreateSubmissionPayload,
  buildUpdateOwnSubmissionPayload,
} from './mutations';
import {
  StudentModuleEmptyState,
  StudentModuleErrorState,
  StudentModuleHeader,
  StudentModuleSkeleton,
  StudentPaginationBar,
} from './shared';

const LIST_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function StudentAssignmentsView({
  initialAssignments,
  initialViewState,
  initialMeta,
}: {
  initialAssignments?: StudentAssignmentDto[];
  initialViewState?: StudentViewState;
  initialMeta?: { total: number; page: number; limit: number; totalPages: number };
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const copy = studentAssignmentsPageCopy;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<StudentAssignmentStatusFilter>('all');
  const [sort, setSort] = useState<StudentAssignmentSortOption>('due_soon');
  const [courseId, setCourseId] = useState('all');
  const [batchId, setBatchId] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [viewState, setViewState] = useState<StudentViewState>(initialViewState ?? 'loading');
  const [assignments, setAssignments] = useState<StudentAssignmentDto[]>(initialAssignments ?? []);
  const [statsAssignments, setStatsAssignments] = useState<StudentAssignmentDto[]>(
    initialAssignments ?? [],
  );
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
        sort === 'alphabetical' ? 'title' : sort === 'recently_updated' ? 'updatedAt' : 'dueAt';
      const sortOrder = sort === 'due_soon' ? 'asc' : 'desc';

      const apiStatus = toAssignmentApiStatus(status);

      const [listResult, statsResult] = await Promise.all([
        StudentApi.getAssignments({
          organizationId,
          search: debouncedQuery || undefined,
          status: apiStatus,
          courseId: courseId === 'all' ? undefined : courseId,
          batchId: batchId === 'all' ? undefined : batchId,
          page,
          limit: LIST_LIMIT,
          sortBy,
          sortOrder,
        }),
        StudentApi.getAssignments({
          organizationId,
          page: 1,
          limit: 100,
          sortBy: 'dueAt',
          sortOrder: 'asc',
        }),
      ]);

      if (signal.aborted) {
        return;
      }

      const visibleList = listResult.items.filter((item) =>
        isStudentVisibleAssignmentStatus(item.status),
      );
      const visibleStats = statsResult.items.filter((item) =>
        isStudentVisibleAssignmentStatus(item.status),
      );

      setAssignments(visibleList);
      setMeta(listResult.meta);
      setStatsAssignments(visibleStats);

      const courses = new Map<string, string>();
      const batches = new Map<string, string>();
      for (const assignment of visibleStats) {
        courses.set(assignment.course.id, assignment.course.title);
        if (assignment.batch) {
          batches.set(assignment.batch.id, assignment.batch.name);
        }
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
        courseId !== 'all' ||
        batchId !== 'all';

      if (visibleList.length === 0 && !filtersActive && listResult.meta.total === 0) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [batchId, courseId, debouncedQuery, page, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialAssignments !== undefined) {
      return;
    }

    const controller = new AbortController();
    if (!hasLoadedRef.current) {
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
  }, [initialAssignments, initialViewState, loadList, reloadKey]);

  const visibleAssignments = useMemo(() => {
    const filtered = filterStudentAssignments(assignments, debouncedQuery, status, {
      courseId,
      batchId,
    });
    return sortStudentAssignments(filtered, sort);
  }, [assignments, batchId, courseId, debouncedQuery, sort, status]);

  const selectedAssignment =
    selectedId === null
      ? null
      : (visibleAssignments.find((item) => item.id === selectedId) ?? null);

  const stats = useMemo(() => deriveStudentAssignmentStats(statsAssignments), [statsAssignments]);

  async function handleSubmit(assignment: StudentAssignmentDto, content: string): Promise<void> {
    if (!canEditOwnSubmission(assignment)) {
      throw new Error('Submission cannot be edited.');
    }
    const organizationId = requireOrganizationId(primaryOrganizationId);
    const previous = assignment;

    // Optimistic local update
    const optimistic: StudentAssignmentDto = {
      ...assignment,
      submission: assignment.submission
        ? {
            ...assignment.submission,
            content,
            status: 'submitted',
            updatedAt: new Date().toISOString(),
          }
        : {
            id: `optimistic-${assignment.id}`,
            status: 'submitted',
            content,
            attachments: [],
            score: null,
            feedback: null,
            submittedAt: new Date().toISOString(),
            gradedAt: null,
            updatedAt: new Date().toISOString(),
          },
    };
    setAssignments((items) => items.map((item) => (item.id === assignment.id ? optimistic : item)));

    try {
      let updated: StudentAssignmentDto | null;
      if (assignment.submission) {
        const payload = buildUpdateOwnSubmissionPayload(content);
        assertNoGradingFields(payload);
        updated = await StudentApi.updateOwnSubmission(
          organizationId,
          assignment.id,
          assignment.submission.id,
          payload,
        );
      } else {
        const createPayload = buildCreateSubmissionPayload(content);
        updated = await StudentApi.submitAssignment({
          organizationId,
          assignmentId: assignment.id,
          content: createPayload.content,
          attachments: createPayload.attachments,
        });
      }

      if (updated) {
        setAssignments((items) =>
          items.map((item) => (item.id === assignment.id ? updated : item)),
        );
        setStatsAssignments((items) =>
          items.map((item) => (item.id === assignment.id ? updated : item)),
        );
      }
    } catch (error) {
      setAssignments((items) => items.map((item) => (item.id === assignment.id ? previous : item)));
      throw error;
    }
  }

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleSkeleton label="Loading Assignments" />
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
      <StudentAssignmentStats stats={stats} />
      <StudentAssignmentFilters
        query={query}
        status={status}
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
      {selectedAssignment ? (
        <StudentAssignmentDetails
          assignment={selectedAssignment}
          onClose={() => {
            setSelectedId(null);
          }}
          onSubmit={handleSubmit}
        />
      ) : null}
      <StudentAssignmentCollection
        assignments={visibleAssignments}
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
