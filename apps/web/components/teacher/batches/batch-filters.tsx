'use client';

import { useId } from 'react';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherBatchSortOptions,
  teacherBatchStatusFilterOptions,
  teacherBatchesPageCopy,
  type TeacherBatchSortOption,
  type TeacherBatchStatusFilter,
} from '../../../lib/teacher';

export function BatchFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: TeacherBatchStatusFilter;
  sort: TeacherBatchSortOption;
  onStatusChange: (value: TeacherBatchStatusFilter) => void;
  onSortChange: (value: TeacherBatchSortOption) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();

  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={teacherBatchStatusFilterOptions}
      sortOptions={teacherBatchSortOptions}
      statusFilterLabel={teacherBatchesPageCopy.statusFilterLabel}
      sortLabel={teacherBatchesPageCopy.sortLabel}
      statusSelectId={statusSelectId}
      sortSelectId={sortSelectId}
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
