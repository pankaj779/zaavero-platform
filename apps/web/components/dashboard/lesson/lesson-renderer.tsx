import type { LessonDetailDto } from '../../../lib/dashboard';
import { ExerciseLesson } from './renderers/exercise-lesson';
import { PdfLesson } from './renderers/pdf-lesson';
import { ReadingLesson } from './renderers/reading-lesson';
import { UnknownLesson } from './renderers/unknown-lesson';
import { VideoLesson } from './renderers/video-lesson';

/**
 * Single content-engine entry point. Add new lesson types by extending
 * LessonContentDto + a dedicated renderer — no shell redesign required.
 */
export function LessonRenderer({ lesson }: { lesson: LessonDetailDto }): React.JSX.Element {
  const { content } = lesson;

  switch (content.type) {
    case 'VIDEO':
      return <VideoLesson content={content} />;
    case 'READING':
      return <ReadingLesson content={content} />;
    case 'PDF':
      return <PdfLesson content={content} />;
    case 'EXERCISE':
      return <ExerciseLesson content={content} />;
    case 'UNKNOWN':
      return <UnknownLesson content={content} />;
  }
}
