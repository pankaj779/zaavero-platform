import {
  assignmentsPageCopy,
  getAssignmentStats,
  type AssignmentDto,
} from '../../../lib/dashboard';
import { DashboardStatGrid } from '../shared';

export function AssignmentStats({ items }: { items: AssignmentDto[] }): React.JSX.Element {
  return (
    <DashboardStatGrid stats={getAssignmentStats(items)} ariaLabel={assignmentsPageCopy.statsLabel} />
  );
}
