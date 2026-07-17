import { DashboardStatGrid } from '../../dashboard/shared';
import { getTeacherCourseStats, type TeacherCourseSummaryDto } from '../../../lib/teacher';

export function CourseStats({
  courses,
}: {
  courses: TeacherCourseSummaryDto[];
}): React.JSX.Element {
  return <DashboardStatGrid stats={getTeacherCourseStats(courses)} ariaLabel="Course statistics" />;
}
