import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherLiveClassStats, type TeacherLiveClassDto } from '../../../lib/teacher';

export function LiveClassStats({
  sessions,
}: {
  sessions: TeacherLiveClassDto[];
}): React.JSX.Element {
  return (
    <DashboardStatGrid
      stats={getTeacherLiveClassStats(sessions)}
      ariaLabel="Live class statistics"
    />
  );
}
