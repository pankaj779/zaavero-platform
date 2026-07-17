'use client';

import { DashboardSearch } from '../../dashboard/shared';
import { teacherAnalyticsPageCopy } from '../../../lib/teacher';

export function AnalyticsSearch({
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
      placeholder={teacherAnalyticsPageCopy.searchPlaceholder}
      ariaLabel={teacherAnalyticsPageCopy.searchLabel}
    />
  );
}
