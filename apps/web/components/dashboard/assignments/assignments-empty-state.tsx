import { icons } from '../../../lib/constants';
import { assignmentsPageCopy } from '../../../lib/dashboard';
import { DashboardEmptyState } from '../shared';

const ClipboardIcon = icons.clipboard;

export function AssignmentsEmptyState(): React.JSX.Element {
  return (
    <DashboardEmptyState
      title={assignmentsPageCopy.emptyTitle}
      description={assignmentsPageCopy.emptyDescription}
      illustration={<ClipboardIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
