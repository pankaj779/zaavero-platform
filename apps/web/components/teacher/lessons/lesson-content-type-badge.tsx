import { Badge } from '@graphology/ui';
import { teacherLessonContentTypeLabel, type TeacherLessonContentType } from '../../../lib/teacher';

const contentTypeVariant: Record<
  TeacherLessonContentType,
  'success' | 'secondary' | 'neutral' | 'warning' | 'primary'
> = {
  video: 'primary',
  pdf: 'secondary',
  reading: 'secondary',
  exercise: 'warning',
  quiz: 'success',
  assignment: 'warning',
  live: 'primary',
  ai_tutor: 'neutral',
};

export function LessonContentTypeBadge({
  contentType,
}: {
  contentType: TeacherLessonContentType;
}): React.JSX.Element {
  return (
    <Badge variant={contentTypeVariant[contentType]}>
      {teacherLessonContentTypeLabel[contentType]}
    </Badge>
  );
}
