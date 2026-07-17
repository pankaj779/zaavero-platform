import { Badge } from '@graphology/ui';
import Link from 'next/link';
import { DASHBOARD_ROUTES, getCourseDetailsPath } from '../../../lib/constants';
import {
  completionStatusLabel,
  lessonPlayerCopy,
  playerLessonTypeLabel,
  type LessonPlayerDto,
} from '../../../lib/dashboard';
import { BookmarkButton } from './bookmark-button';
import { ShareButton } from './share-button';

export function LessonHeader({ data }: { data: LessonPlayerDto }): React.JSX.Element {
  const { course, module, lesson } = data;

  return (
    <header className="space-y-4">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
          <li>
            <Link
              href={DASHBOARD_ROUTES.learning}
              className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {lessonPlayerCopy.breadcrumbLearning}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={getCourseDetailsPath(course.slug)}
              className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {course.title}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground" aria-current="page">
            {lesson.title}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="text-caption text-muted-foreground">
            {course.title}
            <span aria-hidden> · </span>
            Module {module.number}: {module.title}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground tablet:text-3xl">
            {lesson.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{playerLessonTypeLabel[lesson.type]}</Badge>
            <Badge variant="neutral">{lesson.duration.label}</Badge>
            <Badge variant="neutral">{completionStatusLabel(lesson.status)}</Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <BookmarkButton isBookmarked={lesson.isBookmarked} />
          <ShareButton />
        </div>
      </div>
    </header>
  );
}
