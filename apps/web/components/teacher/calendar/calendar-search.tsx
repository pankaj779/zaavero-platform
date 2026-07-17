'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherCalendarPageCopy } from '../../../lib/teacher';

export function CalendarSearch({
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
      placeholder={teacherCalendarPageCopy.searchPlaceholder}
      ariaLabel={teacherCalendarPageCopy.searchLabel}
    />
  );
}
