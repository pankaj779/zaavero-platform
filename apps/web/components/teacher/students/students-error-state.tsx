import { teacherStudentsPageCopy } from '../../../lib/teacher';
import { ErrorState } from '../../dashboard/error-state';

export function StudentsErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherStudentsPageCopy.errorTitle}
      description={teacherStudentsPageCopy.errorDescription}
    />
  );
}
