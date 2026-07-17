import { PageHeader } from '@graphology/ui';
import { teacherAttendancePageCopy } from '../../../lib/teacher';

export function AttendanceHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherAttendancePageCopy.title}
      description={teacherAttendancePageCopy.description}
    />
  );
}
