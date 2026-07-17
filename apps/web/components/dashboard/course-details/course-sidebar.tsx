import { Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import Link from 'next/link';
import { getLessonPath } from '../../../lib/constants';
import {
  courseDetailsCopy,
  getDefaultLessonId,
  type CourseDetailsDto,
} from '../../../lib/dashboard';
import { ProgressSummary } from './progress-summary';

export function CourseSidebar({ course }: { course: CourseDetailsDto }): React.JSX.Element {
  const lessonId = getDefaultLessonId(course.slug);
  const continueHref = lessonId ? getLessonPath(course.slug, lessonId) : undefined;

  return (
    <aside className="laptop:sticky laptop:top-20" aria-label="Course progress sidebar">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{courseDetailsCopy.progressLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProgressSummary course={course} />
          {continueHref ? (
            <Button variant="primary" size="md" className="w-full" asChild>
              <Link href={continueHref}>{courseDetailsCopy.continueLearning}</Link>
            </Button>
          ) : (
            <Button type="button" variant="primary" size="md" className="w-full" disabled>
              {courseDetailsCopy.continueLearning}
            </Button>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
