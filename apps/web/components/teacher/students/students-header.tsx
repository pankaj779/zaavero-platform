import { teacherStudentsPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function StudentsHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherStudentsPageCopy.title}
      description={teacherStudentsPageCopy.description}
    />
  );
}
