import { teacherLiveClassesPageCopy } from '../../../lib/teacher';
import { ErrorState } from '../../dashboard/error-state';

export function LiveClassesErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherLiveClassesPageCopy.errorTitle}
      description={teacherLiveClassesPageCopy.errorDescription}
    />
  );
}
