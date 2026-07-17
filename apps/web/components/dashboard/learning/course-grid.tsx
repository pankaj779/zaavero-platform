import type { EnrolledCourseDto } from '../../../lib/dashboard';
import { learningPageCopy } from '../../../lib/dashboard';
import { CourseCard } from './course-card';

export function CourseGrid({ courses }: { courses: EnrolledCourseDto[] }): React.JSX.Element {
  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={learningPageCopy.gridLabel}
    >
      {courses.map((course) => (
        <li key={course.id}>
          <CourseCard course={course} />
        </li>
      ))}
    </ul>
  );
}
