import { icons } from '../../../lib/constants';
import { teacherMessagesPageCopy } from '../../../lib/teacher';
import { DashboardEmptyState } from '../../dashboard/shared';

const MessageIcon = icons.message;

export function MessagesEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches' | 'no-selection';
}): React.JSX.Element {
  const copy = teacherMessagesPageCopy;

  const title =
    variant === 'no-matches'
      ? copy.noMatchesTitle
      : variant === 'no-selection'
        ? copy.noSelectionTitle
        : copy.emptyTitle;

  const description =
    variant === 'no-matches'
      ? copy.noMatchesDescription
      : variant === 'no-selection'
        ? copy.noSelectionDescription
        : copy.emptyDescription;

  return (
    <DashboardEmptyState
      title={title}
      description={description}
      illustration={<MessageIcon className="h-7 w-7" aria-hidden />}
    />
  );
}
