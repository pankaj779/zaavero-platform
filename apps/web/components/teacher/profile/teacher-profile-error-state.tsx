import { teacherProfilePageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function TeacherProfileErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherProfilePageCopy.errorTitle}
      description={teacherProfilePageCopy.errorDescription}
    />
  );
}
