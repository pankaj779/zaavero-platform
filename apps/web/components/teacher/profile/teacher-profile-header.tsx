import { teacherProfilePageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function TeacherProfileHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherProfilePageCopy.title}
      description={teacherProfilePageCopy.description}
    />
  );
}
