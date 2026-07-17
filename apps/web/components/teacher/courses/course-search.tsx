'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherCoursesPageCopy } from '../../../lib/teacher';

export function CourseSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  return (
    <DashboardSearch
      value={value}
      onChange={onChange}
      placeholder={teacherCoursesPageCopy.searchPlaceholder}
      ariaLabel={teacherCoursesPageCopy.searchLabel}
    />
  );
}
