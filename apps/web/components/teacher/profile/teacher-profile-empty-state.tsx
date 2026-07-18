import { teacherProfilePageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

export function TeacherProfileEmptyState(): React.JSX.Element {
  return (
    <TeacherModuleEmptyState
      title={teacherProfilePageCopy.emptyTitle}
      description={teacherProfilePageCopy.emptyDescription}
      icon="user"
    />
  );
}
