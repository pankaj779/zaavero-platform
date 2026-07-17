import { Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import Link from 'next/link';
import { DASHBOARD_ROUTES } from '../../../lib/constants';
import { courseDetailsCopy, type CourseDetailsDto } from '../../../lib/dashboard';
import { CourseMeta } from './course-meta';
import { ProgressSummary } from './progress-summary';

export function CourseHero({ course }: { course: CourseDetailsDto }): React.JSX.Element {
  return (
    <section className="space-y-6" aria-labelledby="course-title">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              href={DASHBOARD_ROUTES.learning}
              className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {courseDetailsCopy.breadcrumbLearning}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-foreground" aria-current="page">
            {course.title}
          </li>
        </ol>
      </nav>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="space-y-4">
          <CourseMeta course={course} />
          <div className="space-y-2">
            <CardTitle id="course-title" className="text-h2">
              {course.title}
            </CardTitle>
            <p className="max-w-3xl text-body text-muted-foreground">{course.shortDescription}</p>
          </div>
          <p className="text-small text-muted-foreground">
            <span className="font-medium text-foreground">{courseDetailsCopy.instructorLabel}: </span>
            {course.instructor.name}
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 laptop:grid-cols-[1fr_auto] laptop:items-end">
          <ProgressSummary course={course} />
          <Button type="button" variant="primary" size="lg">
            {courseDetailsCopy.continueLearning}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
