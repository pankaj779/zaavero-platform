import { cn } from '@graphology/utils';
import Link from 'next/link';
import { getLessonPath, icons } from '../../../lib/constants';
import { lessonTypeLabel, type CourseLessonDto } from '../../../lib/dashboard';
import { LessonStatus } from './lesson-status';

const VideoIcon = icons.video;
const ReadingIcon = icons.fileText;
const ExerciseIcon = icons.clipboard;

export function LessonItem({
  lesson,
  courseSlug,
}: {
  lesson: CourseLessonDto;
  courseSlug: string;
}): React.JSX.Element {
  const TypeIcon =
    lesson.type === 'video' ? VideoIcon : lesson.type === 'reading' ? ReadingIcon : ExerciseIcon;
  const isLocked = lesson.status === 'locked';

  const content = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-caption font-medium text-foreground">
          {lesson.number}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-foreground">{lesson.title}</p>
          <p className="flex items-center gap-2 text-caption text-muted-foreground">
            <TypeIcon className="h-3.5 w-3.5" aria-hidden />
            <span>{lessonTypeLabel[lesson.type]}</span>
            <span aria-hidden>·</span>
            <span>{lesson.duration.label}</span>
          </p>
        </div>
      </div>
      <LessonStatus status={lesson.status} />
    </>
  );

  const className = cn(
    'flex flex-col gap-3 rounded-lg border border-border bg-surface px-3 py-3 tablet:flex-row tablet:items-center tablet:justify-between',
    lesson.status === 'current' && 'ring-2 ring-ring',
    isLocked && 'opacity-70',
    !isLocked &&
      'transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );

  if (isLocked) {
    return <li className={className}>{content}</li>;
  }

  return (
    <li>
      <Link href={getLessonPath(courseSlug, lesson.id)} className={className}>
        {content}
      </Link>
    </li>
  );
}
