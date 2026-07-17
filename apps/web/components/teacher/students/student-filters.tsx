'use client';

import { useId } from 'react';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherStudentSortOptions,
  teacherStudentStatusFilterOptions,
  teacherStudentsPageCopy,
  type TeacherStudentSortOption,
  type TeacherStudentStatusFilter,
} from '../../../lib/teacher';

export function StudentFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: TeacherStudentStatusFilter;
  sort: TeacherStudentSortOption;
  onStatusChange: (value: TeacherStudentStatusFilter) => void;
  onSortChange: (value: TeacherStudentSortOption) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();

  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={teacherStudentStatusFilterOptions}
      sortOptions={teacherStudentSortOptions}
      statusFilterLabel={teacherStudentsPageCopy.statusFilterLabel}
      sortLabel={teacherStudentsPageCopy.sortLabel}
      statusSelectId={statusSelectId}
      sortSelectId={sortSelectId}
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
