import { teacherLessonsPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function LessonsHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherLessonsPageCopy.title}
      description={teacherLessonsPageCopy.description}
    />
  );
}
