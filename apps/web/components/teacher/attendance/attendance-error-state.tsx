import { teacherAttendancePageCopy } from '../../../lib/teacher';
import { ErrorState } from '../../dashboard/error-state';

export function AttendanceErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherAttendancePageCopy.errorTitle}
      description={teacherAttendancePageCopy.errorDescription}
    />
  );
}
