import { teacherBatchesPageCopy } from '../../../lib/teacher';
import { ErrorState } from '../../dashboard/error-state';

export function BatchesErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherBatchesPageCopy.errorTitle}
      description={teacherBatchesPageCopy.errorDescription}
    />
  );
}
