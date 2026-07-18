import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherSubmissionStats, type TeacherSubmissionSummaryDto } from '../../../lib/teacher';

export function SubmissionStats({
  submissions,
}: {
  submissions: TeacherSubmissionSummaryDto[];
}): React.JSX.Element {
  return (
    <DashboardStatGrid
      stats={getTeacherSubmissionStats(submissions)}
      ariaLabel="Submission statistics"
    />
  );
}
