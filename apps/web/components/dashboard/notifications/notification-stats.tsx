import {
  getNotificationStats,
  notificationsPageCopy,
  type NotificationDto,
} from '../../../lib/dashboard';
import { DashboardStatGrid } from '../shared';

export function NotificationStats({ items }: { items: NotificationDto[] }): React.JSX.Element {
  return (
    <DashboardStatGrid
      stats={getNotificationStats(items)}
      ariaLabel={notificationsPageCopy.statsLabel}
    />
  );
}
