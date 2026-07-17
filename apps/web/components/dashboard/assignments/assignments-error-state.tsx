import { assignmentsPageCopy } from '../../../lib/dashboard';
import { ErrorState } from '../error-state';

export function AssignmentsErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={assignmentsPageCopy.errorTitle}
      description={assignmentsPageCopy.errorDescription}
    />
  );
}
