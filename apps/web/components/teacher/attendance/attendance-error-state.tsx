import { teacherAttendancePageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function AttendanceErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherAttendancePageCopy.errorTitle}
      description={teacherAttendancePageCopy.errorDescription}
    />
  );
}
