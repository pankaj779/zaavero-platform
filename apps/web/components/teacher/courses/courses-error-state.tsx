import { ErrorState } from '../../dashboard/error-state';
import { teacherCoursesPageCopy } from '../../../lib/teacher';

export function CoursesErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherCoursesPageCopy.errorTitle}
      description={teacherCoursesPageCopy.errorDescription}
    />
  );
}
