import { icons } from '../../../lib/constants';
import { profilePageCopy } from '../../../lib/dashboard';
import { DashboardEmptyState } from '../shared';

const UserIcon = icons.user;

export function ProfileEmptyState(): React.JSX.Element {
  return (
    <DashboardEmptyState
      title={profilePageCopy.emptyTitle}
      description={profilePageCopy.emptyDescription}
      illustration={<UserIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
