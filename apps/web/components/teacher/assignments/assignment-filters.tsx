'use client';

import { useId } from 'react';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherAssignmentSortOptions,
  teacherAssignmentStatusFilterOptions,
  teacherAssignmentsPageCopy,
  type TeacherAssignmentSortOption,
  type TeacherAssignmentStatusFilter,
} from '../../../lib/teacher';

export function AssignmentFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: TeacherAssignmentStatusFilter;
  sort: TeacherAssignmentSortOption;
  onStatusChange: (value: TeacherAssignmentStatusFilter) => void;
  onSortChange: (value: TeacherAssignmentSortOption) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();

  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={teacherAssignmentStatusFilterOptions}
      sortOptions={teacherAssignmentSortOptions}
      statusFilterLabel={teacherAssignmentsPageCopy.statusFilterLabel}
      sortLabel={teacherAssignmentsPageCopy.sortLabel}
      statusSelectId={statusSelectId}
      sortSelectId={sortSelectId}
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
