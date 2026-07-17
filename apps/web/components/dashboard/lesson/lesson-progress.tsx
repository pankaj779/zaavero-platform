import { ProgressBar } from '@graphology/ui';
import { lessonPlayerCopy, type LessonPlayerDto } from '../../../lib/dashboard';

export function LessonProgress({ data }: { data: LessonPlayerDto }): React.JSX.Element {
  const { course, module, lesson } = data;

  return (
    <section className="space-y-4" aria-label="Learning progress">
      <ProgressBar value={course.progress.percentage} label={lessonPlayerCopy.progressCourse} />
      <ProgressBar value={module.progress.percentage} label={lessonPlayerCopy.progressModule} />
      <ProgressBar value={lesson.progress.percentage} label={lessonPlayerCopy.progressLesson} />
    </section>
  );
}
