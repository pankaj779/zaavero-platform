'use client';

import { DashboardStatusSortFilters } from '../shared';
import { studentCoursesPageCopy } from './copy';
import {
  studentCourseSortOptions,
  studentEnrollmentStatusFilterOptions,
  type StudentCourseSortOption,
  type StudentEnrollmentStatusFilter,
} from './learning-helpers';

export function StudentCourseFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: StudentEnrollmentStatusFilter;
  sort: StudentCourseSortOption;
  onStatusChange: (value: StudentEnrollmentStatusFilter) => void;
  onSortChange: (value: StudentCourseSortOption) => void;
}): React.JSX.Element {
  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={studentEnrollmentStatusFilterOptions}
      sortOptions={studentCourseSortOptions}
      statusFilterLabel={studentCoursesPageCopy.statusFilterLabel}
      sortLabel={studentCoursesPageCopy.sortLabel}
      statusSelectId="student-learning-status-filter"
      sortSelectId="student-learning-sort"
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
