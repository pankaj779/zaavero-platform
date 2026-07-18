import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherLessonStats, type TeacherLessonSummaryDto } from '../../../lib/teacher';

export function LessonStats({
  lessons,
}: {
  lessons: TeacherLessonSummaryDto[];
}): React.JSX.Element {
  return <DashboardStatGrid stats={getTeacherLessonStats(lessons)} ariaLabel="Lesson statistics" />;
}
