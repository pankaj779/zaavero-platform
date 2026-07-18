import { teacherAssignmentsPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function AssignmentsHeader(): React.JSX.Element {
  return (
    <TeacherPageHeader
      title={teacherAssignmentsPageCopy.title}
      description={teacherAssignmentsPageCopy.description}
    />
  );
}
