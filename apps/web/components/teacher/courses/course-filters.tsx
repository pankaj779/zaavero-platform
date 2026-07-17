'use client';

import { useId } from 'react';
import { DashboardStatusSortFilters } from '../../dashboard/shared';
import {
  teacherCourseSortOptions,
  teacherCourseStatusFilterOptions,
  teacherCoursesPageCopy,
  type TeacherCourseSortOption,
  type TeacherCourseStatusFilter,
} from '../../../lib/teacher';

export function CourseFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: TeacherCourseStatusFilter;
  sort: TeacherCourseSortOption;
  onStatusChange: (value: TeacherCourseStatusFilter) => void;
  onSortChange: (value: TeacherCourseSortOption) => void;
}): React.JSX.Element {
  const statusSelectId = useId();
  const sortSelectId = useId();

  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={teacherCourseStatusFilterOptions}
      sortOptions={teacherCourseSortOptions}
      statusFilterLabel={teacherCoursesPageCopy.statusFilterLabel}
      sortLabel={teacherCoursesPageCopy.sortLabel}
      statusSelectId={statusSelectId}
      sortSelectId={sortSelectId}
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
