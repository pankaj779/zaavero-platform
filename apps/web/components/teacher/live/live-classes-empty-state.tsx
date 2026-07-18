import { teacherLiveClassesPageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

export function LiveClassesEmptyState({
  variant = 'empty',
}: {
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherLiveClassesPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <TeacherModuleEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      icon="video"
    />
  );
}
