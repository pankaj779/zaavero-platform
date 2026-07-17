'use client';

import { notificationsPageCopy } from '../../../lib/dashboard';
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
      placeholder={notificationsPageCopy.searchPlaceholder}
      ariaLabel={notificationsPageCopy.searchLabel}
    />
  );
}
