import { teacherMessagesPageCopy } from '../../../lib/teacher';
import { ErrorState } from '../../dashboard/error-state';

export function MessagesErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherMessagesPageCopy.errorTitle}
      description={teacherMessagesPageCopy.errorDescription}
    />
  );
}
