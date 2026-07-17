'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherAttendancePageCopy } from '../../../lib/teacher';

export function AttendanceSearch({
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
      placeholder={teacherAttendancePageCopy.searchPlaceholder}
      ariaLabel={teacherAttendancePageCopy.searchLabel}
    />
  );
}
