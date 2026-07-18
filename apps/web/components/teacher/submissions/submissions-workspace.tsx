'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherSubmissions,
  getTeacherSubmissionById,
  sortTeacherSubmissions,
  type TeacherSubmissionSortOption,
  type TeacherSubmissionStatusFilter,
  type TeacherSubmissionSummaryDto,
  type TeacherSubmissionsViewMode,
} from '../../../lib/teacher';
import { SubmissionCollection } from './submission-collection';
import { SubmissionDetailsPanel } from './submission-details-panel';
import { SubmissionFilters } from './submission-filters';
import { SubmissionSearch } from './submission-search';
import { SubmissionViewToggle } from './submission-view-toggle';
import { SubmissionsEmptyState } from './submissions-empty-state';

export function SubmissionsWorkspace({
  submissions,
  query: controlledQuery,
  searchQuery,
  status: controlledStatus,
  sort: controlledSort,
  assignmentId: controlledAssignmentId,
  assignmentOptions = [{ value: 'all', label: 'All Assignments' }],
  onQueryChange,
  onStatusChange,
  onSortChange,
  onAssignmentChange,
  onGrade,
  serverFiltered = false,
}: {
  submissions: TeacherSubmissionSummaryDto[];
  query?: string;
  /** Debounced query used for client-side search when serverFiltered. */
  searchQuery?: string;
  status?: TeacherSubmissionStatusFilter;
  sort?: TeacherSubmissionSortOption;
  assignmentId?: string;
  assignmentOptions?: readonly { value: string; label: string }[];
  onQueryChange?: (value: string) => void;
  onStatusChange?: (value: TeacherSubmissionStatusFilter) => void;
  onSortChange?: (value: TeacherSubmissionSortOption) => void;
  onAssignmentChange?: (value: string) => void;
  onGrade?: (submissionId: string, score: number, feedback: string) => Promise<void>;
  serverFiltered?: boolean;
}): React.JSX.Element {
  const [localQuery, setLocalQuery] = useState('');
  const [localStatus, setLocalStatus] = useState<TeacherSubmissionStatusFilter>('all');
  const [localSort, setLocalSort] = useState<TeacherSubmissionSortOption>('recently_updated');
  const [localAssignmentId, setLocalAssignmentId] = useState('all');
  const [mode, setMode] = useState<TeacherSubmissionsViewMode>('grid');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const query = controlledQuery ?? localQuery;
  const status = controlledStatus ?? localStatus;
  const sort = controlledSort ?? localSort;
  const assignmentId = controlledAssignmentId ?? localAssignmentId;
  const effectiveSearch = searchQuery ?? query;

  const visibleSubmissions = useMemo(() => {
    if (serverFiltered) {
      return filterTeacherSubmissions(submissions, effectiveSearch, 'all');
    }
    const filtered = filterTeacherSubmissions(submissions, query, status, {
      assignmentId,
    });
    return sortTeacherSubmissions(filtered, sort);
  }, [assignmentId, effectiveSearch, query, serverFiltered, sort, status, submissions]);

  const selectedSubmission = useMemo(
    () =>
      selectedSubmissionId === null
        ? null
        : getTeacherSubmissionById(submissions, selectedSubmissionId),
    [selectedSubmissionId, submissions],
  );

  const showNoMatches = visibleSubmissions.length === 0;

  return (
    <div className="space-y-8">
      <section className="space-y-4" aria-label="Submission filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <SubmissionSearch value={query} onChange={onQueryChange ?? setLocalQuery} />
          </div>
          <SubmissionFilters
            status={status}
            sort={sort}
            assignmentId={assignmentId}
            assignmentOptions={assignmentOptions}
            onStatusChange={onStatusChange ?? setLocalStatus}
            onSortChange={onSortChange ?? setLocalSort}
            onAssignmentChange={onAssignmentChange ?? setLocalAssignmentId}
          />
          <div className="flex justify-end laptop:ml-auto">
            <SubmissionViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {selectedSubmission ? (
        <SubmissionDetailsPanel
          submission={selectedSubmission}
          onGrade={onGrade}
          onClose={() => {
            setSelectedSubmissionId(null);
          }}
        />
      ) : null}

      {showNoMatches ? (
        <SubmissionsEmptyState variant="no-matches" />
      ) : (
        <SubmissionCollection
          submissions={visibleSubmissions}
          mode={mode}
          selectedSubmissionId={selectedSubmissionId}
          onSelect={setSelectedSubmissionId}
        />
      )}
    </div>
  );
}
