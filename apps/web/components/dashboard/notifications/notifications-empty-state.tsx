import { icons } from '../../../lib/constants';
import { notificationsPageCopy } from '../../../lib/dashboard';
import { DashboardEmptyState } from '../shared';

const BellIcon = icons.bell;

export function NotificationsEmptyState(): React.JSX.Element {
  return (
    <DashboardEmptyState
      title={notificationsPageCopy.emptyTitle}
      description={notificationsPageCopy.emptyDescription}
      illustration={<BellIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
