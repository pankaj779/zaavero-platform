import { teacherSubmissionsPageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

export function SubmissionsEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherSubmissionsPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <TeacherModuleEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      icon="clipboard"
    />
  );
}
