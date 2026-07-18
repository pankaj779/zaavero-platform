import { teacherMessagesPageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

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

  return <TeacherModuleEmptyState title={title} description={description} icon="message" />;
}
