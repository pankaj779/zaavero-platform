import { teacherAssignmentsPageCopy } from '../../../lib/teacher';
import { ErrorState } from '../../dashboard/error-state';

export function AssignmentsErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherAssignmentsPageCopy.errorTitle}
      description={teacherAssignmentsPageCopy.errorDescription}
    />
  );
}
