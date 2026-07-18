import { teacherCoursesPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function CoursesErrorState(): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherCoursesPageCopy.errorTitle}
      description={teacherCoursesPageCopy.errorDescription}
    />
  );
}
