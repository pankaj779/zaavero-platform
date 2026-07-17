import { Badge } from '@graphology/ui';
import {
  attendanceStudentStatusLabel,
  type AttendanceStudentStatus,
} from '../../../lib/teacher';

const recordVariant: Record<AttendanceStudentStatus, 'success' | 'danger'> = {
  present: 'success',
  absent: 'danger',
};

/** Present / Absent badge for a student attendance record. */
export function AttendanceRecordBadge({
  status,
}: {
  status: AttendanceStudentStatus;
}): React.JSX.Element {
  return <Badge variant={recordVariant[status]}>{attendanceStudentStatusLabel[status]}</Badge>;
}
