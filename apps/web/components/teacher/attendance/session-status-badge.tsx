import { Badge } from '@graphology/ui';
import {
  attendanceSessionStatusLabel,
  type AttendanceSessionStatus,
} from '../../../lib/teacher';

const statusVariant: Record<AttendanceSessionStatus, 'warning' | 'success' | 'neutral'> = {
  scheduled: 'warning',
  completed: 'success',
  cancelled: 'neutral',
};

export function SessionStatusBadge({
  status,
}: {
  status: AttendanceSessionStatus;
}): React.JSX.Element {
  return <Badge variant={statusVariant[status]}>{attendanceSessionStatusLabel[status]}</Badge>;
}
