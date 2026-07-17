import { icons } from '../../../lib/constants';
import { teacherBatchesPageCopy } from '../../../lib/teacher';
import { DashboardEmptyState } from '../../dashboard/shared';

const UsersIcon = icons.users;

export function BatchesEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherBatchesPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <DashboardEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      illustration={<UsersIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
