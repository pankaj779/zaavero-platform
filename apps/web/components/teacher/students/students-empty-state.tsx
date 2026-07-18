import { teacherStudentsPageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

export function StudentsEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherStudentsPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <TeacherModuleEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      icon="users"
    />
  );
}
