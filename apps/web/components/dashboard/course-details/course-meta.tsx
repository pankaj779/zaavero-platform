import { Badge } from '@graphology/ui';
import {
  courseDetailsCopy,
  difficultyLabel,
  type CourseDetailsDto,
} from '../../../lib/dashboard';

export function CourseMeta({ course }: { course: CourseDetailsDto }): React.JSX.Element {
  return (
    <dl className="flex flex-wrap gap-2" aria-label="Course metadata">
      <div>
        <dt className="sr-only">{courseDetailsCopy.difficultyLabel}</dt>
        <dd>
          <Badge variant="neutral">{difficultyLabel[course.difficulty]}</Badge>
        </dd>
      </div>
      <div>
        <dt className="sr-only">{courseDetailsCopy.categoryLabel}</dt>
        <dd>
          <Badge variant="secondary">{course.category}</Badge>
        </dd>
      </div>
    </dl>
  );
}
