import { teacherStudentsPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function StudentsErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherStudentsPageCopy.errorTitle}
      description={teacherStudentsPageCopy.errorDescription}
    />
  );
}
