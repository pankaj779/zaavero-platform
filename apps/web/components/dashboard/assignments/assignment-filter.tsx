'use client';

import {
  assignmentSortOptions,
  assignmentStatusFilterOptions,
  assignmentsPageCopy,
  type AssignmentSortOption,
  type AssignmentStatusFilter,
} from '../../../lib/dashboard';
import { DashboardStatusSortFilters } from '../shared';

export function AssignmentFilter({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: AssignmentStatusFilter;
  sort: AssignmentSortOption;
  onStatusChange: (value: AssignmentStatusFilter) => void;
  onSortChange: (value: AssignmentSortOption) => void;
}): React.JSX.Element {
  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={assignmentStatusFilterOptions}
      sortOptions={assignmentSortOptions}
      statusFilterLabel={assignmentsPageCopy.statusFilterLabel}
      sortLabel={assignmentsPageCopy.sortLabel}
      statusSelectId="assignment-status-filter"
      sortSelectId="assignment-sort"
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
