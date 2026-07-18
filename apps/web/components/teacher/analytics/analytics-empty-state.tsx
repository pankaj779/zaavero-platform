import { teacherAnalyticsPageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

export function AnalyticsEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherAnalyticsPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <TeacherModuleEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      icon="trending"
    />
  );
}
