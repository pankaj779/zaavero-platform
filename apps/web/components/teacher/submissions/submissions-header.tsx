import { teacherSubmissionsPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function SubmissionsHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherSubmissionsPageCopy.title}
      description={teacherSubmissionsPageCopy.description}
    />
  );
}
