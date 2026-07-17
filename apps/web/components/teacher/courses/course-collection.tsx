import {
  teacherCoursesPageCopy,
  type TeacherCourseSummaryDto,
  type TeacherCoursesViewMode,
} from '../../../lib/teacher';
import { CourseCard } from './course-card';

/**
 * Renders the visible courses in grid or list layout from the same card component.
 */
export function CourseCollection({
  courses,
  mode,
}: {
  courses: TeacherCourseSummaryDto[];
  mode: TeacherCoursesViewMode;
}): React.JSX.Element {
  if (mode === 'list') {
    return (
      <ul className="flex flex-col gap-4" aria-label={teacherCoursesPageCopy.gridLabel}>
        {courses.map((course) => (
          <li key={course.id}>
            <CourseCard course={course} layout="list" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={teacherCoursesPageCopy.gridLabel}
    >
      {courses.map((course) => (
        <li key={course.id} className="h-full">
          <CourseCard course={course} layout="grid" />
        </li>
      ))}
    </ul>
  );
}
