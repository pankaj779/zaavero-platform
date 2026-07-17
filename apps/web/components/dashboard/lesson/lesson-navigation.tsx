import { Button } from '@graphology/ui';
import Link from 'next/link';
import { getCourseDetailsPath, getLessonPath, icons } from '../../../lib/constants';
import { lessonPlayerCopy, type LessonPlayerDto } from '../../../lib/dashboard';

const ChevronLeftIcon = icons.chevronLeft;
const ChevronRightIcon = icons.chevronRight;

export function LessonNavigation({ data }: { data: LessonPlayerDto }): React.JSX.Element {
  const { course, lesson } = data;
  const previousHref = lesson.navigation.previousLessonId
    ? getLessonPath(course.slug, lesson.navigation.previousLessonId)
    : null;
  const nextHref = lesson.navigation.nextLessonId
    ? getLessonPath(course.slug, lesson.navigation.nextLessonId)
    : null;

  return (
    <nav
      className="flex flex-col gap-3 border-t border-border pt-6 tablet:flex-row tablet:items-center tablet:justify-between"
      aria-label="Lesson navigation"
    >
      <Button variant="outline" size="md" className="w-full tablet:w-auto" asChild>
        <Link href={getCourseDetailsPath(course.slug)}>{lessonPlayerCopy.backToCourse}</Link>
      </Button>

      <div className="flex w-full flex-col gap-2 tablet:w-auto tablet:flex-row">
        {previousHref ? (
          <Button variant="outline" size="md" className="w-full tablet:w-auto" asChild>
            <Link href={previousHref}>
              <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              {lessonPlayerCopy.previousLesson}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="md" className="w-full tablet:w-auto" disabled>
            <ChevronLeftIcon className="h-4 w-4" aria-hidden />
            {lessonPlayerCopy.previousLesson}
          </Button>
        )}

        {nextHref ? (
          <Button variant="primary" size="md" className="w-full tablet:w-auto" asChild>
            <Link href={nextHref}>
              {lessonPlayerCopy.nextLesson}
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button variant="primary" size="md" className="w-full tablet:w-auto" disabled>
            {lessonPlayerCopy.nextLesson}
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </nav>
  );
}
