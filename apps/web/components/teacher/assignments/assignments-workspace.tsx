'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherAssignments,
  getTeacherAssignmentById,
  sortTeacherAssignments,
  type TeacherAssignmentDto,
  type TeacherAssignmentSortOption,
  type TeacherAssignmentStatusFilter,
  type TeacherAssignmentsViewMode,
} from '../../../lib/teacher';
import { AssignmentCollection } from './assignment-collection';
import { AssignmentDetailsPanel } from './assignment-details-panel';
import { AssignmentFilters } from './assignment-filters';
import { AssignmentSearch } from './assignment-search';
import { AssignmentViewToggle } from './assignment-view-toggle';
import { AssignmentsEmptyState } from './assignments-empty-state';

/** Client boundary containing assignment discovery and selection state. */
export function AssignmentsWorkspace({
  assignments,
  query: controlledQuery,
  status: controlledStatus,
  sort: controlledSort,
  courseId: controlledCourseId,
  batchId: controlledBatchId,
  courseOptions = [{ value: 'all', label: 'All Courses' }],
  batchOptions = [{ value: 'all', label: 'All Batches' }],
  organizationId = '',
  onQueryChange,
  onStatusChange,
  onSortChange,
  onCourseChange,
  onBatchChange,
  onAssignmentUpdated,
  serverFiltered = false,
}: {
  assignments: TeacherAssignmentDto[];
  query?: string;
  status?: TeacherAssignmentStatusFilter;
  sort?: TeacherAssignmentSortOption;
  courseId?: string;
  batchId?: string;
  courseOptions?: readonly { value: string; label: string }[];
  batchOptions?: readonly { value: string; label: string }[];
  organizationId?: string;
  onQueryChange?: (value: string) => void;
  onStatusChange?: (value: TeacherAssignmentStatusFilter) => void;
  onSortChange?: (value: TeacherAssignmentSortOption) => void;
  onCourseChange?: (value: string) => void;
  onBatchChange?: (value: string) => void;
  onAssignmentUpdated?: (assignment: TeacherAssignmentDto) => void;
  /** When true, parent already applied server-side filters — skip local filter/sort. */
  serverFiltered?: boolean;
}): React.JSX.Element {
  const [localQuery, setLocalQuery] = useState('');
  const [localStatus, setLocalStatus] = useState<TeacherAssignmentStatusFilter>('all');
  const [localSort, setLocalSort] = useState<TeacherAssignmentSortOption>('recently_updated');
  const [localCourseId, setLocalCourseId] = useState('all');
  const [localBatchId, setLocalBatchId] = useState('all');
  const [mode, setMode] = useState<TeacherAssignmentsViewMode>('grid');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  const query = controlledQuery ?? localQuery;
  const status = controlledStatus ?? localStatus;
  const sort = controlledSort ?? localSort;
  const courseId = controlledCourseId ?? localCourseId;
  const batchId = controlledBatchId ?? localBatchId;

  const visibleAssignments = useMemo(() => {
    if (serverFiltered) {
      return assignments;
    }
    const filtered = filterTeacherAssignments(assignments, query, status, {
      courseId,
      batchId,
    });
    return sortTeacherAssignments(filtered, sort);
  }, [assignments, batchId, courseId, query, serverFiltered, sort, status]);

  const selectedAssignment = useMemo(
    () =>
      selectedAssignmentId === null
        ? null
        : getTeacherAssignmentById(assignments, selectedAssignmentId),
    [assignments, selectedAssignmentId],
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4" aria-label="Assignment filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <AssignmentSearch value={query} onChange={onQueryChange ?? setLocalQuery} />
          </div>
          <AssignmentFilters
            status={status}
            sort={sort}
            courseId={courseId}
            batchId={batchId}
            courseOptions={courseOptions}
            batchOptions={batchOptions}
            onStatusChange={onStatusChange ?? setLocalStatus}
            onSortChange={onSortChange ?? setLocalSort}
            onCourseChange={onCourseChange ?? setLocalCourseId}
            onBatchChange={onBatchChange ?? setLocalBatchId}
          />
          <div className="flex justify-end laptop:ml-auto">
            <AssignmentViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {selectedAssignment ? (
        <AssignmentDetailsPanel
          assignment={selectedAssignment}
          organizationId={organizationId}
          onClose={() => {
            setSelectedAssignmentId(null);
          }}
          onAssignmentUpdated={onAssignmentUpdated}
        />
      ) : null}

      {visibleAssignments.length === 0 ? (
        <AssignmentsEmptyState variant="no-matches" />
      ) : (
        <AssignmentCollection
          assignments={visibleAssignments}
          mode={mode}
          selectedAssignmentId={selectedAssignmentId}
          onSelect={setSelectedAssignmentId}
        />
      )}
    </div>
  );
}
