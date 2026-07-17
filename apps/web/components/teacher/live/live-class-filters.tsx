'use client';

import { useId } from 'react';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherLiveClassSortOptions,
  teacherLiveClassesPageCopy,
  teacherLiveClassStatusFilterOptions,
  type TeacherLiveClassSortOption,
  type TeacherLiveClassStatusFilter,
} from '../../../lib/teacher';

export function LiveClassFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: TeacherLiveClassStatusFilter;
  sort: TeacherLiveClassSortOption;
  onStatusChange: (value: TeacherLiveClassStatusFilter) => void;
  onSortChange: (value: TeacherLiveClassSortOption) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();

  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={teacherLiveClassStatusFilterOptions}
      sortOptions={teacherLiveClassSortOptions}
      statusFilterLabel={teacherLiveClassesPageCopy.statusFilterLabel}
      sortLabel={teacherLiveClassesPageCopy.sortLabel}
      statusSelectId={statusSelectId}
      sortSelectId={sortSelectId}
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
