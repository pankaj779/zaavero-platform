import { teacherCoursesPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function CoursesHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherCoursesPageCopy.title}
      description={teacherCoursesPageCopy.description}
    />
  );
}
