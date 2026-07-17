'use client';

import {
  learningPageCopy,
  sortOptions,
  statusFilterOptions,
  type CourseSortOption,
  type CourseStatusFilter,
} from '../../../lib/dashboard';
import { DashboardStatusSortFilters } from '../shared';

export function CourseFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: CourseStatusFilter;
  sort: CourseSortOption;
  onStatusChange: (value: CourseStatusFilter) => void;
  onSortChange: (value: CourseSortOption) => void;
}): React.JSX.Element {
  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={statusFilterOptions}
      sortOptions={sortOptions}
      statusFilterLabel={learningPageCopy.statusFilterLabel}
      sortLabel={learningPageCopy.sortLabel}
      statusSelectId="learning-status-filter"
      sortSelectId="learning-sort"
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
