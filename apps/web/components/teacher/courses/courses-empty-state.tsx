import { teacherCoursesPageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

export function CoursesEmptyState({
  variant = 'empty',
}: {
  /** `empty` — no courses at all; `no-matches` — filters returned nothing. */
  variant?: 'empty' | 'no-matches';
}): React.JSX.Element {
  const copy = teacherCoursesPageCopy;
  const isEmpty = variant === 'empty';

  return (
    <TeacherModuleEmptyState
      title={isEmpty ? copy.emptyTitle : copy.noMatchesTitle}
      description={isEmpty ? copy.emptyDescription : copy.noMatchesDescription}
      icon="book"
    />
  );
}
