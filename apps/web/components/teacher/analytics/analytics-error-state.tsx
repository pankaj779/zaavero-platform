import { teacherAnalyticsPageCopy } from '../../../lib/teacher';
import { ErrorState } from '../../dashboard/error-state';

export function AnalyticsErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={teacherAnalyticsPageCopy.errorTitle}
      description={teacherAnalyticsPageCopy.errorDescription}
    />
  );
}
