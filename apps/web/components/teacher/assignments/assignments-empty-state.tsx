import { icons } from '../../../lib/constants';
import { teacherAssignmentsPageCopy } from '../../../lib/teacher';
import { DashboardEmptyState } from '../../dashboard/shared';

const ClipboardIcon = icons.clipboard;

export function AssignmentsEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <DashboardEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      illustration={<ClipboardIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
