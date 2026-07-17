import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherAssignmentStats, type TeacherAssignmentDto } from '../../../lib/teacher';

export function AssignmentStats({
  assignments,
}: {
  assignments: TeacherAssignmentDto[];
}): React.JSX.Element {
  return (
    <DashboardStatGrid
      stats={getTeacherAssignmentStats(assignments)}
      ariaLabel="Assignment statistics"
    />
  );
}
