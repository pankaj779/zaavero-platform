import { teacherSettingsPageCopy } from '../../../lib/teacher';
import { TeacherModuleEmptyState } from '../shared';

export function TeacherSettingsEmptyState(): React.JSX.Element {
  return (
    <TeacherModuleEmptyState
      title={teacherSettingsPageCopy.emptyTitle}
      description={teacherSettingsPageCopy.emptyDescription}
      icon="settings"
    />
  );
}
