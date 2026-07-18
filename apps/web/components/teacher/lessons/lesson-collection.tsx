import {
  teacherLessonsPageCopy,
  type TeacherLessonSummaryDto,
  type TeacherLessonsViewMode,
} from '../../../lib/teacher';
import { LessonCard } from './lesson-card';

export function LessonCollection({
  lessons,
  mode,
  selectedLessonId,
  onSelect,
}: {
  lessons: TeacherLessonSummaryDto[];
  mode: TeacherLessonsViewMode;
  selectedLessonId?: string | null;
  onSelect?: (lessonId: string) => void;
}): React.JSX.Element {
  if (mode === 'list') {
    return (
      <ul className="flex flex-col gap-4" aria-label={teacherLessonsPageCopy.gridLabel}>
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <LessonCard
              lesson={lesson}
              layout="list"
              selected={selectedLessonId === lesson.id}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={teacherLessonsPageCopy.gridLabel}
    >
      {lessons.map((lesson) => (
        <li key={lesson.id} className="h-full">
          <LessonCard
            lesson={lesson}
            layout="grid"
            selected={selectedLessonId === lesson.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
