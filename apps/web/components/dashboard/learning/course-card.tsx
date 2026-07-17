import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import Link from 'next/link';
import { getCourseDetailsPath } from '../../../lib/constants';
import {
  difficultyBadgeLabel,
  formatLastAccessedLabel,
  learningPageCopy,
  statusBadgeLabel,
  type EnrolledCourseDto,
} from '../../../lib/dashboard';
import { CourseProgress } from './course-progress';
import { CourseThumbnail } from './course-thumbnail';

export function CourseCard({ course }: { course: EnrolledCourseDto }): React.JSX.Element {
  const detailsHref = getCourseDetailsPath(course.slug);

  return (
    <Card
      variant="course"
      className="flex h-full flex-col rounded-xl transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md"
    >
      <CardHeader className="space-y-4 p-5 pb-0">
        <CourseThumbnail label={course.media.thumbnailAlt} />
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{statusBadgeLabel[course.status]}</Badge>
          <Badge variant="neutral">{difficultyBadgeLabel[course.difficulty]}</Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
          <CardDescription className="leading-relaxed">{course.description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-small text-muted-foreground">
          <span className="font-medium text-foreground">{learningPageCopy.instructorLabel}: </span>
          {course.instructor.name}
        </p>

        <CourseProgress
          value={course.progress.percentage}
          lessonsCompleted={course.progress.completedLessons}
          totalLessons={course.progress.totalLessons}
          lessonsLabel={learningPageCopy.lessonsLabel}
        />

        <dl className="grid gap-2 text-caption text-muted-foreground">
          <div className="flex items-start justify-between gap-3">
            <dt>{learningPageCopy.remainingLabel}</dt>
            <dd className="text-right text-foreground">
              {course.progress.estimatedTimeRemaining ?? 'Completed'}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt>{learningPageCopy.lastAccessedLabel}</dt>
            <dd className="text-right text-foreground">
              {formatLastAccessedLabel(course.lastAccessedAt)}
            </dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-5 pt-0 tablet:flex-row">
        <Button variant="primary" size="md" className="w-full tablet:flex-1" asChild>
          <Link href={detailsHref}>{learningPageCopy.continueButton}</Link>
        </Button>
        <Button variant="outline" size="md" className="w-full tablet:flex-1" asChild>
          <Link href={detailsHref}>{learningPageCopy.detailsButton}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
