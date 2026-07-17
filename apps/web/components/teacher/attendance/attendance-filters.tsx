'use client';

import { useId } from 'react';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  attendanceSortOptions,
  attendanceStatusFilterOptions,
  teacherAttendancePageCopy,
  type AttendanceSortOption,
  type AttendanceStatusFilter,
} from '../../../lib/teacher';

export function AttendanceFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: AttendanceStatusFilter;
  sort: AttendanceSortOption;
  onStatusChange: (value: AttendanceStatusFilter) => void;
  onSortChange: (value: AttendanceSortOption) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();

  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={attendanceStatusFilterOptions}
      sortOptions={attendanceSortOptions}
      statusFilterLabel={teacherAttendancePageCopy.statusFilterLabel}
      sortLabel={teacherAttendancePageCopy.sortLabel}
      statusSelectId={statusSelectId}
      sortSelectId={sortSelectId}
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
