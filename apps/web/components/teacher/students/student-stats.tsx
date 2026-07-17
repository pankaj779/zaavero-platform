import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherStudentStats, type TeacherStudentSummaryDto } from '../../../lib/teacher';

export function StudentStats({
  students,
}: {
  students: TeacherStudentSummaryDto[];
}): React.JSX.Element {
  return (
    <DashboardStatGrid stats={getTeacherStudentStats(students)} ariaLabel="Student statistics" />
  );
}
