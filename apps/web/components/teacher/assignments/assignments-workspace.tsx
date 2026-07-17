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

/** Client boundary containing only assignment discovery and selection state. */
export function AssignmentsWorkspace({
  assignments,
}: {
  assignments: TeacherAssignmentDto[];
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TeacherAssignmentStatusFilter>('all');
  const [sort, setSort] = useState<TeacherAssignmentSortOption>('recently_updated');
  const [mode, setMode] = useState<TeacherAssignmentsViewMode>('grid');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  const visibleAssignments = useMemo(() => {
    const filtered = filterTeacherAssignments(assignments, query, status);
    return sortTeacherAssignments(filtered, sort);
  }, [assignments, query, sort, status]);

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
            <AssignmentSearch value={query} onChange={setQuery} />
          </div>
          <AssignmentFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
          <div className="flex justify-end laptop:ml-auto">
            <AssignmentViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {selectedAssignment ? (
        <AssignmentDetailsPanel
          assignment={selectedAssignment}
          onClose={() => {
            setSelectedAssignmentId(null);
          }}
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
