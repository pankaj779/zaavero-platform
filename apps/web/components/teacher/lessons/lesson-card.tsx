import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherLessonDate,
  formatTeacherLessonDuration,
  teacherLessonsPageCopy,
  type TeacherLessonSummaryDto,
  type TeacherLessonsViewMode,
} from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../shared';
import { LessonContentTypeBadge } from './lesson-content-type-badge';

function LessonMetrics({
  lesson,
  className,
}: {
  lesson: TeacherLessonSummaryDto;
  className?: string;
}): React.JSX.Element {
  const copy = teacherLessonsPageCopy;
  const metrics = [
    { id: 'course', label: copy.courseLabel, value: lesson.course.title },
    { id: 'module', label: copy.moduleLabel, value: lesson.module.name },
    {
      id: 'duration',
      label: copy.durationLabel,
      value: formatTeacherLessonDuration(lesson.durationSeconds),
    },
    { id: 'order', label: copy.orderLabel, value: String(lesson.displayOrder) },
  ];

  return (
    <dl className={cn('grid grid-cols-2 gap-2 text-caption', className)}>
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
        >
          <dt className="text-muted-foreground">{metric.label}</dt>
          <dd className="truncate text-right font-medium text-foreground">{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LessonActions({
  lesson,
  onSelect,
}: {
  lesson: TeacherLessonSummaryDto;
  onSelect?: (lessonId: string) => void;
}): React.JSX.Element {
  const copy = teacherLessonsPageCopy;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-2 tablet:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full tablet:flex-1"
          onClick={() => {
            onSelect?.(lesson.id);
          }}
          aria-label={`${copy.detailsButton} ${lesson.title}`}
        >
          {copy.detailsButton}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full tablet:flex-1"
          disabled
          aria-label={`${copy.editButton} ${lesson.title} — coming soon`}
        >
          {copy.editButton}
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}

export function LessonCard({
  lesson,
  layout = 'grid',
  selected = false,
  onSelect,
}: {
  lesson: TeacherLessonSummaryDto;
  layout?: TeacherLessonsViewMode;
  selected?: boolean;
  onSelect?: (lessonId: string) => void;
}): React.JSX.Element {
  const copy = teacherLessonsPageCopy;
  const updatedLabel = `${copy.lastUpdatedLabel}: ${formatTeacherLessonDate(lesson.updatedAt)}`;

  if (layout === 'list') {
    return (
      <Card
        className={cn(teacherCardSurfaceClass, selected && 'ring-2 ring-brand-500')}
        aria-selected={selected}
      >
        <CardContent className="flex flex-col gap-4 p-5 laptop:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <LessonContentTypeBadge contentType={lesson.contentType} />
              </div>
              <CardTitle className="text-base leading-snug">{lesson.title}</CardTitle>
              {lesson.description ? (
                <p className="text-small text-muted-foreground">{lesson.description}</p>
              ) : null}
              <p className="text-caption text-muted-foreground">{updatedLabel}</p>
            </div>
            <LessonMetrics lesson={lesson} className="tablet:grid-cols-4" />
            <LessonActions lesson={lesson} onSelect={onSelect} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'flex h-full flex-col',
        teacherCardSurfaceClass,
        selected && 'ring-2 ring-brand-500',
      )}
      aria-selected={selected}
    >
      <CardHeader className="space-y-4 p-5 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <LessonContentTypeBadge contentType={lesson.contentType} />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-base leading-snug">{lesson.title}</CardTitle>
          {lesson.description ? (
            <p className="text-small leading-relaxed text-muted-foreground">{lesson.description}</p>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <LessonMetrics lesson={lesson} />
        <p className="text-caption text-muted-foreground">{updatedLabel}</p>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <LessonActions lesson={lesson} onSelect={onSelect} />
      </CardFooter>
    </Card>
  );
}
