import { teacherSubmissionsPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function SubmissionsErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherSubmissionsPageCopy.errorTitle}
      description={teacherSubmissionsPageCopy.errorDescription}
    />
  );
}
