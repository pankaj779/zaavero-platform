import { teacherAssignmentsPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function AssignmentsErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherAssignmentsPageCopy.errorTitle}
      description={teacherAssignmentsPageCopy.errorDescription}
    />
  );
}
