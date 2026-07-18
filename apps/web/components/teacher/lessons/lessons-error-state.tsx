import { teacherLessonsPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function LessonsErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherLessonsPageCopy.errorTitle}
      description={teacherLessonsPageCopy.errorDescription}
    />
  );
}
