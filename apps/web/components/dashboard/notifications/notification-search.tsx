'use client';

import { teacherNotificationsPageCopy } from '../../../lib/teacher';
import { DashboardSearch } from '../shared';

export function NotificationSearch({
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
      placeholder={teacherNotificationsPageCopy.searchPlaceholder}
      ariaLabel={teacherNotificationsPageCopy.searchLabel}
    />
  );
}
