import { teacherAnalyticsPageCopy } from '../../../lib/teacher';
import { TeacherModuleErrorState } from '../shared';

export function AnalyticsErrorState({ onRetry }: { onRetry?: () => void }): React.JSX.Element {
  return (
    <TeacherModuleErrorState
      title={teacherAnalyticsPageCopy.errorTitle}
      description={teacherAnalyticsPageCopy.errorDescription}
      retryLabel={teacherAnalyticsPageCopy.retryButton}
      onRetry={onRetry}
    />
  );
}
