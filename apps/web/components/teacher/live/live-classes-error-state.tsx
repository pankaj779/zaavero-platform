import { teacherLiveClassesPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function LiveClassesErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherLiveClassesPageCopy.errorTitle}
      description={teacherLiveClassesPageCopy.errorDescription}
    />
  );
}
