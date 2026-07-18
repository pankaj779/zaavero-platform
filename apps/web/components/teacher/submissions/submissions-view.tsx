'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AssignmentApi, SubmissionApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  toSubmissionApiStatus,
  toSubmissionListSort,
  type TeacherSubmissionSortOption,
  type TeacherSubmissionStatusFilter,
  type TeacherSubmissionSummaryDto,
  type TeacherSubmissionsViewState,
} from '../../../lib/teacher';
import { SubmissionStats } from './submission-stats';
import { SubmissionsEmptyState } from './submissions-empty-state';
import { SubmissionsErrorState } from './submissions-error-state';
import { SubmissionsHeader } from './submissions-header';
import { SubmissionsSkeleton } from './submissions-skeleton';
import { SubmissionsWorkspace } from './submissions-workspace';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function SubmissionsView({
  initialSubmissions,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialSubmissions?: TeacherSubmissionSummaryDto[];
  initialViewState?: TeacherSubmissionsViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<TeacherSubmissionStatusFilter>('all');
  const [sort, setSort] = useState<TeacherSubmissionSortOption>('recently_updated');
  const [assignmentId, setAssignmentId] = useState('all');
  const [assignmentOptions, setAssignmentOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Assignments' },
  ]);

  const [viewState, setViewState] = useState<TeacherSubmissionsViewState>(
    initialViewState ?? 'loading',
  );
  const [submissions, setSubmissions] = useState<TeacherSubmissionSummaryDto[]>(
    initialSubmissions ?? [],
  );
  const [statsSubmissions, setStatsSubmissions] = useState<TeacherSubmissionSummaryDto[]>(
    initialSubmissions ?? [],
  );
  const hasLoadedRef = useRef(initialViewState !== undefined);

  const gradeSubmission = useCallback(
    async (submissionId: string, scoreValue: number, feedback: string) => {
      const updated = await SubmissionApi.updateSubmission(submissionId, {
        score: scoreValue,
        feedback: feedback.length > 0 ? feedback : null,
        status: 'GRADED',
      });
      const mergeUpdate = (current: TeacherSubmissionSummaryDto[]): TeacherSubmissionSummaryDto[] =>
        current.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                status: updated.status,
                score: updated.score,
                feedback: updated.feedback,
                gradedAt: updated.gradedAt,
                grader: updated.grader ?? submission.grader,
                updatedAt: updated.updatedAt,
              }
            : submission,
        );
      setSubmissions(mergeUpdate);
      setStatsSubmissions(mergeUpdate);
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (initialViewState !== undefined && initialSubmissions !== undefined) {
      return;
    }

    void (async () => {
      try {
        const result = await AssignmentApi.getAssignments({
          organizationId: primaryOrganizationId ?? undefined,
          page: 1,
          limit: LIST_LIMIT,
          sortBy: 'title',
          sortOrder: 'asc',
          enrichLookups: false,
        });
        setAssignmentOptions([
          { value: 'all', label: 'All Assignments' },
          ...result.items.map((assignment) => ({
            value: assignment.id,
            label: assignment.title,
          })),
        ]);
      } catch {
        setAssignmentOptions([{ value: 'all', label: 'All Assignments' }]);
      }
    })();
  }, [initialSubmissions, initialViewState, primaryOrganizationId]);

  const loadStats = useCallback(
    async (signal: AbortSignal) => {
      const result = await SubmissionApi.getSubmissions({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      if (signal.aborted) {
        return;
      }
      setStatsSubmissions(result.items);
    },
    [primaryOrganizationId],
  );

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { sortBy, sortOrder } = toSubmissionListSort(sort);
      const result = await SubmissionApi.getSubmissions({
        organizationId: primaryOrganizationId ?? undefined,
        status: toSubmissionApiStatus(status),
        assignmentId: assignmentId === 'all' ? undefined : assignmentId,
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      setSubmissions(result.items);

      const filtersActive = status !== 'all' || assignmentId !== 'all';
      if (result.items.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [assignmentId, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialSubmissions !== undefined) {
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
  }, [initialSubmissions, initialViewState, loadList, loadStats]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <SubmissionsHeader />
        <SubmissionsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <SubmissionsHeader />
        <SubmissionsErrorState />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <SubmissionsHeader />
        <SubmissionsEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SubmissionsHeader />
      <SubmissionStats submissions={statsSubmissions} />
      <SubmissionsWorkspace
        submissions={submissions}
        query={query}
        searchQuery={debouncedQuery}
        status={status}
        sort={sort}
        assignmentId={assignmentId}
        assignmentOptions={assignmentOptions}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onSortChange={setSort}
        onAssignmentChange={setAssignmentId}
        onGrade={gradeSubmission}
        serverFiltered
      />
    </div>
  );
}
