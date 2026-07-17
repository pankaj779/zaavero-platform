import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherAttendanceStats, type AttendanceSessionDto } from '../../../lib/teacher';

export function AttendanceStats({
  sessions,
}: {
  sessions: AttendanceSessionDto[];
}): React.JSX.Element {
  return (
    <DashboardStatGrid
      stats={getTeacherAttendanceStats(sessions)}
      ariaLabel="Attendance statistics"
    />
  );
}
