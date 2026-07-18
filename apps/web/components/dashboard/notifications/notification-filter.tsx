'use client';

import {
  teacherNotificationSortOptions,
  teacherNotificationStatusFilterOptions,
  teacherNotificationsPageCopy,
  type TeacherNotificationSortOption,
  type TeacherNotificationStatusFilter,
} from '../../../lib/teacher';
import { DashboardStatusSortFilters } from '../shared';

export function NotificationFilter({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: TeacherNotificationStatusFilter;
  sort: TeacherNotificationSortOption;
  onStatusChange: (value: TeacherNotificationStatusFilter) => void;
  onSortChange: (value: TeacherNotificationSortOption) => void;
}): React.JSX.Element {
  return (
    <DashboardStatusSortFilters
      status={status}
      sort={sort}
      statusOptions={teacherNotificationStatusFilterOptions}
      sortOptions={teacherNotificationSortOptions}
      statusFilterLabel={teacherNotificationsPageCopy.statusFilterLabel}
      sortLabel={teacherNotificationsPageCopy.sortLabel}
      statusSelectId="notification-status-filter"
      sortSelectId="notification-sort"
      onStatusChange={onStatusChange}
      onSortChange={onSortChange}
    />
  );
}
