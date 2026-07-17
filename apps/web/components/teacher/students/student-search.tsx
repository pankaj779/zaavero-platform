'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherStudentsPageCopy } from '../../../lib/teacher';

export function StudentSearch({
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
      placeholder={teacherStudentsPageCopy.searchPlaceholder}
      ariaLabel={teacherStudentsPageCopy.searchLabel}
    />
  );
}
