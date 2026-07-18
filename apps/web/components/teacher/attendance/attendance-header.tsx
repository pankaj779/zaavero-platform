import { teacherAttendancePageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function AttendanceHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherAttendancePageCopy.title}
      description={teacherAttendancePageCopy.description}
    />
  );
}
