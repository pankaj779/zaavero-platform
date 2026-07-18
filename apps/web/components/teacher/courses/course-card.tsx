import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherCourseDate,
  teacherCoursesPageCopy,
  type TeacherCourseSummaryDto,
  type TeacherCoursesViewMode,
} from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../shared';
import { CourseStatusBadge } from './course-status-badge';
import { CourseThumbnail } from './course-thumbnail';

function CourseCounts({
  course,
  className,
}: {
  course: TeacherCourseSummaryDto;
  className?: string;
}): React.JSX.Element {
  const copy = teacherCoursesPageCopy;
  const entries = [
    { id: 'batches', label: copy.batchesLabel, value: course.counts.batches },
    { id: 'students', label: copy.studentsLabel, value: course.counts.students },
    { id: 'lessons', label: copy.lessonsLabel, value: course.counts.lessons },
    { id: 'assignments', label: copy.assignmentsLabel, value: course.counts.assignments },
  ];

  return (
    <dl className={cn('grid grid-cols-2 gap-2 text-caption', className)}>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
        >
          <dt className="text-muted-foreground">{entry.label}</dt>
          <dd className="font-medium text-foreground">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CourseActions({ courseTitle }: { courseTitle: string }): React.JSX.Element {
  const copy = teacherCoursesPageCopy;
  const actions = [
    { id: 'view', label: copy.viewButton },
    { id: 'manage', label: copy.manageButton },
    { id: 'analytics', label: copy.analyticsButton },
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-2 tablet:flex-row">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            size="sm"
            className="w-full tablet:flex-1"
            disabled
            aria-label={`${action.label} ${courseTitle} — coming soon`}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}

/**
 * Reusable teacher course card — renders in grid or list layout from the same DTO.
 */
export function CourseCard({
  course,
  layout = 'grid',
}: {
  course: TeacherCourseSummaryDto;
  layout?: TeacherCoursesViewMode;
}): React.JSX.Element {
  const copy = teacherCoursesPageCopy;
  const updatedLabel = `${copy.lastUpdatedLabel}: ${formatTeacherCourseDate(course.updatedAt)}`;
  const publishBadge = course.isPublished ? (
    <Badge variant="success">{copy.publishedLabel}</Badge>
  ) : (
    <Badge variant="neutral">{copy.unpublishedLabel}</Badge>
  );

  if (layout === 'list') {
    return (
      <Card className={teacherCardSurfaceClass}>
        <CardContent className="flex flex-col gap-4 p-5 laptop:flex-row">
          <CourseThumbnail
            label={course.media.thumbnailAlt}
            className="laptop:w-56 laptop:shrink-0 laptop:self-start"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CourseStatusBadge status={course.status} />
                {publishBadge}
              </div>
              <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
              <p className="text-small text-muted-foreground">{course.description}</p>
              <p className="text-caption text-muted-foreground">{updatedLabel}</p>
            </div>
            <CourseCounts course={course} className="tablet:grid-cols-4" />
            <CourseActions courseTitle={course.title} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex h-full flex-col', teacherCardSurfaceClass)}>
      <CardHeader className="space-y-4 p-5 pb-0">
        <CourseThumbnail label={course.media.thumbnailAlt} />
        <div className="flex flex-wrap items-center gap-2">
          <CourseStatusBadge status={course.status} />
          {publishBadge}
        </div>
        <div className="space-y-2">
          <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
          <p className="text-small leading-relaxed text-muted-foreground">{course.description}</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <CourseCounts course={course} />
        <p className="text-caption text-muted-foreground">{updatedLabel}</p>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <CourseActions courseTitle={course.title} />
      </CardFooter>
    </Card>
  );
}
