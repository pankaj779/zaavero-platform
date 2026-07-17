import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherBatchStats, type TeacherBatchSummaryDto } from '../../../lib/teacher';

export function BatchStats({
  batches,
}: {
  batches: TeacherBatchSummaryDto[];
}): React.JSX.Element {
  return <DashboardStatGrid stats={getTeacherBatchStats(batches)} ariaLabel="Batch statistics" />;
}
