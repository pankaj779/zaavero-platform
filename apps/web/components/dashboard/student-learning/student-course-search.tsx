'use client';

import { DashboardSearch } from '../shared';
import { studentCoursesPageCopy } from './copy';

export function StudentCourseSearch({
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
      placeholder={studentCoursesPageCopy.searchPlaceholder}
      ariaLabel={studentCoursesPageCopy.searchLabel}
    />
  );
}
