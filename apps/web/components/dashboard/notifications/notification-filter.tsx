'use client';

import {
  notificationSortOptions,
  notificationStatusFilterOptions,
  notificationsPageCopy,
  type NotificationSortOption,
  type NotificationStatusFilter,
} from '../../../lib/dashboard';
import { DashboardStatusSortFilters } from '../shared';

export function NotificationFilter({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: NotificationStatusFilter;
  sort: NotificationSortOption;
  onStatusChange: (value: NotificationStatusFilter) => void;
  onSortChange: (value: NotificationSortOption) => void;
}): React.JSX.Element {
  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={notificationStatusFilterOptions}
      sortOptions={notificationSortOptions}
      statusFilterLabel={notificationsPageCopy.statusFilterLabel}
      sortLabel={notificationsPageCopy.sortLabel}
      statusSelectId="notification-status-filter"
      sortSelectId="notification-sort"
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
